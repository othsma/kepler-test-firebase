import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { db } from './firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';

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
        this.messaging = getMessaging();
        this.setupMessageListener();
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
    if (!this.isSupported || !this.messaging) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return false;
      }

      // Try to register service worker if not already registered
      if ('serviceWorker' in navigator) {
        try {
          // Check if service worker is already registered
          const registrations = await navigator.serviceWorker.getRegistrations();
          const firebaseSW = registrations.find(reg => reg.scope.includes('firebase'));

          if (!firebaseSW) {
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          }
        } catch (swError) {
          console.error('Service worker registration failed:', swError);
          // Continue anyway - Firebase might handle it
        }
      }

      // Small delay to ensure service worker is ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get FCM token - let Firebase handle service worker registration
      const token = await getToken(this.messaging, {
        vapidKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      });

      if (!token) {
        console.error('Failed to get FCM token');
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
      console.error('Error subscribing to push notifications:', error);
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

  get isPushSupported(): boolean {
    return this.isSupported;
  }
}

// Singleton instance
export const pushManager = new PushNotificationManager();
