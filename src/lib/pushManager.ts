import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { db } from './firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc } from 'firebase/firestore';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationManager {
  private messaging: any = null;
  private isSupported: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.isSupported = await isSupported();
      if (this.isSupported) {
        // Initialize Firebase messaging
        this.messaging = getMessaging();

        // Register Firebase messaging service worker explicitly
        console.log('🔥 Initializing Firebase messaging service worker...');
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
              scope: '/'
            });
            console.log('🔥 Firebase messaging service worker registered:', registration.scope);
          } catch (error) {
            console.error('🔥 Failed to register Firebase messaging service worker:', error);
          }
        }

        this.setupMessageListener();
        console.log('🔥 Firebase messaging initialized successfully');
      } else {
        console.warn('🔥 Firebase messaging not supported in this browser');
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  private setupMessageListener() {
    if (!this.messaging) return;

    // Listen for foreground messages
    onMessage(this.messaging, (payload) => {
      console.log('Received foreground message:', payload);

      // Show browser notification for foreground messages
      if (Notification.permission === 'granted') {
        const notification = new Notification(payload.notification?.title || 'Notification', {
          body: payload.notification?.body,
          icon: '/omegalogo.png',
          badge: '/omegalogo.png',
          data: payload.data,
          tag: payload.data?.tag || 'repair-notification'
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Handle notification click
        notification.onclick = () => {
          notification.close();
          // Navigate to customer dashboard
          window.focus();
          window.location.href = payload.data?.url || '/customer';
        };
      }
    });
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported in this browser');
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async subscribeToPush(customerId: string): Promise<boolean> {
    console.log('🔍 DEBUG: Starting subscribeToPush for customer:', customerId);

    // Check if running on HTTPS (required for push notifications)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.error('Push notifications require HTTPS. Current protocol:', location.protocol);
      return false;
    }

    console.log('🔍 DEBUG: HTTPS/Localhost check passed');

    // For mobile browsers, try to initialize messaging even if Firebase says it's not supported
    let messagingToUse = this.messaging;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile && !this.messaging) {
      try {
        messagingToUse = getMessaging();
        console.log('🔍 DEBUG: Initialized messaging for mobile browser');
      } catch (initError) {
        console.error('Failed to initialize Firebase messaging for mobile:', initError);
        return false;
      }
    }

    if (!messagingToUse) {
      console.warn('Push notifications not supported - no messaging instance');
      return false;
    }

    console.log('🔍 DEBUG: Firebase messaging instance available');

    try {
      // Request permission first
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Push notification permission denied');
        return false;
      }

      // Firebase will handle service worker registration automatically
      // We don't need to manually register it - Firebase does this during getToken()
      console.log('🔍 DEBUG: Firebase will handle service worker registration automatically');

      // Wait for service worker to be fully activated
      console.log('🔍 DEBUG: Waiting for service worker to activate...');
      const registration = await navigator.serviceWorker.ready;
      console.log('🔍 DEBUG: Service worker is ready:', {
        scope: registration.scope,
        active: !!registration.active,
        state: registration.active?.state
      });

      // Check all registered service workers
      const allRegistrations = await navigator.serviceWorker.getRegistrations();
      console.log('🔍 DEBUG: All service worker registrations:');
      allRegistrations.forEach((reg, index) => {
        console.log(`🔍 DEBUG: SW ${index}:`, {
          scope: reg.scope,
          active: !!reg.active,
          state: reg.active?.state,
          installing: !!reg.installing,
          waiting: !!reg.waiting
        });
      });

      // Get FCM token - let Firebase handle service worker registration
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
      console.log('🔍 DEBUG: VAPID key available:', vapidKey ? 'YES (' + vapidKey.substring(0, 20) + '...)' : 'NO');

      // Configure service worker for Firebase messaging
      console.log('🔍 DEBUG: Configuring service worker for Firebase messaging...');

      const token = await getToken(messagingToUse, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: await navigator.serviceWorker.ready
      });

      console.log('🔍 DEBUG: FCM token retrieved:', token ? 'YES (' + token.substring(0, 50) + '...)' : 'NO');

      if (!token) {
        console.error('Failed to get FCM token - token is null/empty');
        return false;
      }

      // Validate token format (basic validation)
      if (!this.isValidFCMToken(token)) {
        console.error('Invalid FCM token format. Token:', token.substring(0, 50) + '...', 'Length:', token.length);
        return false;
      }

      // Store token in customer profile document
      await updateDoc(doc(db, 'customer_profiles', customerId), {
        fcmTokens: arrayUnion(token),
        'notificationPreferences.pushEnabled': true,
        lastPushTokenUpdate: new Date()
      });

      return true;
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      return false;
    }
  }

  async unsubscribeFromPush(customerId: string, token?: string): Promise<boolean> {
    try {
      if (token) {
        // Remove specific token
        await updateDoc(doc(db, 'customer_profiles', customerId), {
          fcmTokens: arrayRemove(token),
          'notificationPreferences.pushEnabled': false
        });
      } else {
        // Disable all push notifications for customer
        await updateDoc(doc(db, 'customer_profiles', customerId), {
          fcmTokens: [],
          'notificationPreferences.pushEnabled': false
        });
      }
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Validates FCM token format
   */
  private isValidFCMToken(token: string): boolean {
    // FCM tokens are typically 100-300 characters and contain alphanumeric, hyphens, underscores, dots, and colons
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Basic length check (FCM tokens vary in length)
    if (token.length < 100 || token.length > 300) {
      return false;
    }

    // Check for valid characters (FCM tokens can contain colons)
    const validTokenRegex = /^[a-zA-Z0-9_.:-]+$/;
    return validTokenRegex.test(token);
  }

  get isPushSupported(): boolean {
    // Enhanced support check that's more permissive for mobile browsers
    const hasNotificationAPI = 'Notification' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const isHttps = location.protocol === 'https:' || location.hostname === 'localhost';

    // Firebase's strict check
    const firebaseSupported = this.isSupported;

    // Mobile browsers may have basic support even if Firebase says no
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // For mobile, be more permissive - check basic APIs
    if (isMobile) {
      const basicSupport = hasNotificationAPI && hasServiceWorker && hasPushManager && isHttps;
      return basicSupport;
    }

    // For desktop, use Firebase's strict check
    return firebaseSupported;
  }
}

// Singleton instance
export const pushManager = new PushNotificationManager();
