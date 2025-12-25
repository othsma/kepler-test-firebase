import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Bell, User, LogOut, Smartphone, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { useThemeStore } from '../../lib/store';
import { useCustomerStore } from '../../lib/customerStore';
import { logoutUser } from '../../lib/firebase';
import { pushManager } from '../../lib/pushManager';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';

interface NotificationItem {
  id: string;
  customerId: string;
  type: 'push' | 'email' | 'sms';
  title: string;
  message: string;
  ticketId?: string;
  status: 'sent' | 'delivered' | 'failed';
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

export default function CustomerLayout() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const {
    user,
    profile,
    tickets,
    reset,
    fetchProfile,
    fetchTickets,
    subscribeToTickets
  } = useCustomerStore();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user && !profile) {
      fetchProfile();
      fetchTickets();
    }
  }, [user, profile, fetchProfile, fetchTickets]);

  useEffect(() => {
    if (profile) {
      const unsubscribe = subscribeToTickets();
      return unsubscribe;
    }
  }, [profile, subscribeToTickets]);

  // Fetch unread notification count on component mount and when user changes
  useEffect(() => {
    if (user?.uid) {
      fetchUnreadNotificationCount();
    }
  }, [user?.uid]);

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (showNotificationDropdown && user?.uid && !notificationLoading) {
      fetchRecentNotifications();
    }
  }, [showNotificationDropdown, user?.uid]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadNotificationCount = async () => {
    if (!user?.uid) {
      console.log('❌ fetchUnreadNotificationCount: No user UID');
      return;
    }

    console.log('🔍 fetchUnreadNotificationCount: Starting for user:', user.uid);

    try {
      // Get all notifications and count unread ones (Firestore doesn't support null queries)
      const q = query(
        collection(db, 'notification_history'),
        where('customerId', '==', user.uid),
        orderBy('sentAt', 'desc'),
        limit(50) // Get recent notifications to count unread
      );

      console.log('🔍 fetchUnreadNotificationCount: Query created');

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('🔍 fetchUnreadNotificationCount: Snapshot received, docs count:', snapshot.docs.length);

        // Count notifications that don't have readAt field (unread)
        const unreadCount = snapshot.docs.filter(doc => {
          const data = doc.data();
          console.log('🔍 Notification data:', data);
          return !data.readAt; // No readAt field means unread
        }).length;

        console.log('🔍 fetchUnreadNotificationCount: Unread count:', unreadCount);
        setUnreadNotificationCount(unreadCount);
      }, (error) => {
        console.error('🔍 fetchUnreadNotificationCount: Error in snapshot:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('🔍 fetchUnreadNotificationCount: Error:', error);
    }
  };

  const fetchRecentNotifications = async () => {
    if (!user?.uid) return;

    setNotificationLoading(true);
    try {
      const q = query(
        collection(db, 'notification_history'),
        where('customerId', '==', user.uid),
        orderBy('sentAt', 'desc'),
        limit(5) // Show only 5 most recent
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const notificationData: NotificationItem[] = [];

        // Process notifications and fetch ticket numbers if needed
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();

          // Extract title and message from notification data
          let title = '';
          let message = '';

          if (data.type === 'status_change') {
            title = `Statut de réparation mis à jour`;
            message = `Votre réparation ${data.metadata?.deviceInfo || 'appareil'} est maintenant ${data.metadata?.newStatus || 'mis à jour'}`;
          } else if (data.type === 'email') {
            title = `Notification par email`;
            message = `Mise à jour réparation - ${data.metadata?.deviceInfo || 'appareil'}`;
          } else if (data.channel === 'push') {
            title = `Notification push`;
            message = `Votre réparation a été mise à jour`;
          } else {
            title = `Notification ${data.channel || 'générale'}`;
            message = `Vous avez une nouvelle notification`;
          }

          // Get ticketNumber - try metadata first, then fetch from ticket document
          let ticketNumber = data.metadata?.ticketNumber || data.ticketId;

          // If we don't have ticketNumber in metadata, try to fetch it from the ticket
          if (!data.metadata?.ticketNumber && data.ticketId) {
            try {
              const ticketDoc = await getDoc(doc(db, 'tickets', data.ticketId));
              if (ticketDoc.exists()) {
                const ticketData = ticketDoc.data();
                ticketNumber = ticketData?.ticketNumber || data.ticketId;
              }
            } catch (error) {
              console.error('Error fetching ticket number:', error);
              ticketNumber = data.ticketId; // fallback
            }
          }

          notificationData.push({
            id: docSnap.id,
            customerId: data.customerId,
            type: data.channel || data.type || 'push', // Use channel as type
            title,
            message,
            ticketId: data.ticketId,
            ticketNumber, // Use the resolved ticketNumber
            status: data.status,
            createdAt: data.sentAt?.toDate() || new Date(), // Use sentAt as createdAt
            deliveredAt: data.deliveredAt?.toDate(),
            readAt: data.readAt?.toDate()
          } as NotificationItem);
        }

        setNotifications(notificationData);
        setNotificationLoading(false);
      });

      // Return unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotificationLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notification_history', notificationId), {
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleBellClick = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'push':
        return <Smartphone className="h-4 w-4 text-blue-500" />;
      case 'email':
        return <Bell className="h-4 w-4 text-green-500" />;
      case 'sms':
        return <Bell className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 24 * 7) return `Il y a ${Math.floor(diffInHours / 24)}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Phase 2C: Smart Auto-Generation - Check for FCM tokens on login
  useEffect(() => {
    const autoGenerateFCMToken = async () => {
      if (!profile?.id) return;

      // Check if push notifications are enabled but no FCM tokens exist
      const hasPushEnabled = profile.notificationPreferences?.pushEnabled;
      const hasFCMTokens = profile.fcmTokens && profile.fcmTokens.length > 0;

      if (hasPushEnabled && !hasFCMTokens) {
        try {
          // Attempt silent FCM token generation (no user interaction)
          const success = await pushManager.subscribeToPush(profile.id);
          if (success) {
            // Refresh profile to get updated FCM tokens
            await fetchProfile();
          }
        } catch (error) {
          // Don't show error to user - this is background operation
        }
      }
    };

    // Only run auto-generation after profile is fully loaded
    if (profile && profile.id) {
      // Small delay to ensure everything is initialized
      const timer = setTimeout(autoGenerateFCMToken, 2000);
      return () => clearTimeout(timer);
    }
  }, [profile, fetchProfile]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      reset();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Redirect to customer login if not authenticated
  if (!user) {
    return <Navigate to="/customer/login" />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Customer Header */}
      <header className={`bg-white dark:bg-gray-800 shadow-sm border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Smartphone className="h-8 w-8 text-indigo-600" />
                <span className={`ml-2 text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  O'MEGA Services
                </span>
              </div>
            </div>

            {/* Right side - Notifications and Profile */}
            <div className="flex items-center space-x-4">
              {/* Notifications Bell with Dropdown */}
              <div className="relative">
                <button
                  ref={bellRef}
                  onClick={handleBellClick}
                  className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Notifications"
                >
                  <Bell className="h-6 w-6" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <div
                    ref={dropdownRef}
                    className={`absolute right-0 mt-2 w-80 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-50`}
                  >
                    <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Notifications récentes
                      </h3>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notificationLoading ? (
                        <div className="p-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Chargement...
                          </p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center">
                          <Bell className={`h-8 w-8 mx-auto mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Aucune notification récente
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} transition-colors cursor-pointer`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getTypeIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${notification.readAt ? (isDarkMode ? 'text-gray-400' : 'text-gray-600') : (isDarkMode ? 'text-white' : 'text-gray-900')} truncate`}>
                                  {notification.title}
                                </p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 line-clamp-2`}>
                                  {notification.message}
                                </p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
                                  {formatRelativeTime(notification.createdAt)}
                                </p>
                              </div>
                              {!notification.readAt && (
                                <div className="flex-shrink-0">
                                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <a
                        href="/customer/notifications"
                        className={`block w-full text-center text-sm ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'} font-medium`}
                        onClick={() => setShowNotificationDropdown(false)}
                      >
                        Voir toutes les notifications
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {profile?.fullName || 'Client'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
                  title="Déconnexion"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Customer Navigation */}
      <nav className={`bg-white dark:bg-gray-800 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <a
              href="/customer"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                window.location.pathname === '/customer'
                  ? 'border-indigo-500 text-indigo-600'
                  : `border-transparent ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              Mes Réparations
            </a>
            <a
              href="/customer/notifications"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                window.location.pathname === '/customer/notifications'
                  ? 'border-indigo-500 text-indigo-600'
                  : `border-transparent ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              Notifications
            </a>
            <a
              href="/customer/profile"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                window.location.pathname === '/customer/profile'
                  ? 'border-indigo-500 text-indigo-600'
                  : `border-transparent ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              Mon Profil
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
