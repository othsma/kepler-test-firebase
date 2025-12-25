import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { pushManager } from '../../lib/pushManager';
import { useCustomerStore } from '../../lib/customerStore';
import { useThemeStore } from '../../lib/store';

export default function PushNotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { profile, fetchProfile, updateProfile } = useCustomerStore();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  useEffect(() => {
    // Check if we should show the banner - enhanced for mobile
    const checkNotificationStatus = () => {
      // Basic checks
      if (!profile?.id) {
        return false;
      }

      // If push notifications are already enabled, don't show banner
      if (profile.notificationPreferences?.pushEnabled) {
        return false;
      }

      // Enhanced push notification support check for mobile
      const hasNotificationAPI = 'Notification' in window;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      const pushManagerSupported = pushManager.isPushSupported;

      const isPushSupported = pushManagerSupported && hasNotificationAPI;

      // Special handling for mobile browsers
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      // iOS Safari has limited push notification support
      if (isIOS && !(window.navigator as any).standalone) {
        // Only show on iOS if in PWA mode or if we detect web push capability
        const hasWebPush = hasServiceWorker && hasPushManager;
        if (!hasWebPush) {
          return false;
        }
      }

      // If push notifications are not supported at all, hide banner
      if (!isPushSupported) {
        return false;
      }

      // Check permission status - be more permissive for mobile
      const permission = Notification.permission;

      if (permission === 'denied') {
        // On mobile, sometimes permission appears as 'denied' initially
        // Allow banner to show so user can try to enable
        if (isMobile) {
          return true;
        }
        return false;
      }

      return isPushSupported;
    };

    setIsVisible(checkNotificationStatus());
  }, [profile]);

  const handleSubscribe = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      const success = await pushManager.subscribeToPush(profile.id);
      if (success) {
        setIsSubscribed(true);
        // Refresh profile data to update the store
        await fetchProfile();
        setTimeout(() => {
          setIsVisible(false);
        }, 3000); // Hide after 3 seconds
      } else {
        // Show error state - subscription failed
        console.error('Push notification subscription failed');
        // Banner will remain visible for user to retry
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      // Banner remains visible for user to retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`rounded-lg shadow-lg border-l-4 border-indigo-500 p-4 mb-6 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Bell className="h-6 w-6 text-indigo-500" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {isSubscribed ? 'Notifications activées !' : 'Recevoir des notifications'}
              </h3>
              <div className="mt-2">
                {!isSubscribed ? (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Soyez informé en temps réel de l'avancement de vos réparations.
                    Recevez des notifications push sur votre téléphone ou ordinateur.
                  </p>
                ) : (
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Vous recevrez désormais des notifications sur l'état de vos réparations.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 ml-4">
              {!isSubscribed ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSubscribe}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                        Activation...
                      </>
                    ) : (
                      'Activer'
                    )}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className={`inline-flex items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                      isDarkMode
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDismiss}
                  className={`inline-flex items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                    isDarkMode
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
