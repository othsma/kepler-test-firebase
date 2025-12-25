import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Archive,
  Search,
  Filter,
  Calendar,
  Download
} from 'lucide-react';
import { useThemeStore } from '../../lib/store';
import { useCustomerStore } from '../../lib/customerStore';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, startAfter, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface NotificationItem {
  id: string;
  customerId: string;
  type: 'push' | 'email' | 'sms';
  title: string;
  message: string;
  ticketId?: string;
  ticketNumber?: string;
  status: 'sent' | 'delivered' | 'failed';
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

export default function NotificationHistory() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { user } = useCustomerStore();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Real-time subscription
  useEffect(() => {
    if (!user?.uid) {
      console.log('❌ NotificationHistory: No user UID');
      return;
    }

    console.log('🔍 NotificationHistory: Starting for user:', user.uid);
    setLoading(true);

    const q = query(
      collection(db, 'notification_history'),
      where('customerId', '==', user.uid),
      orderBy('sentAt', 'desc'),
      limit(20)
    );

    console.log('🔍 NotificationHistory: Query created');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('🔍 NotificationHistory: Snapshot received, docs count:', snapshot.docs.length);

      const notificationData: NotificationItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔍 NotificationHistory: Notification data:', data);

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

        notificationData.push({
          id: doc.id,
          customerId: data.customerId,
          type: data.channel || data.type || 'push', // Use channel as type
          title,
          message,
          ticketId: data.ticketId,
          ticketNumber, // Use ticketNumber from metadata (will be updated later)
          status: data.status,
          createdAt: data.sentAt?.toDate() || new Date(), // Use sentAt as createdAt
          deliveredAt: data.deliveredAt?.toDate(),
          readAt: data.readAt?.toDate()
        } as NotificationItem);
      });

      console.log('🔍 NotificationHistory: Processed notifications:', notificationData.length);
      setNotifications(notificationData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 20);
      setLoading(false);
    }, (err) => {
      console.error('🔍 NotificationHistory: Error fetching notifications:', err);
      setError('Erreur lors du chargement des notifications');
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.uid]);

  const loadMore = () => {
    if (!user?.uid || !lastDoc || !hasMore) return;

    const q = query(
      collection(db, 'notification_history'),
      where('customerId', '==', user.uid),
      orderBy('sentAt', 'desc'),
      startAfter(lastDoc),
      limit(20)
    );

    onSnapshot(q, (snapshot) => {
      const additionalNotifications: NotificationItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

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

        additionalNotifications.push({
          id: doc.id,
          customerId: data.customerId,
          type: data.channel || data.type || 'push', // Use channel as type
          title,
          message,
          ticketId: data.ticketId,
          ticketNumber: data.metadata?.ticketNumber || data.ticketId, // Use ticketNumber from metadata
          status: data.status,
          createdAt: data.sentAt?.toDate() || new Date(), // Use sentAt as createdAt
          deliveredAt: data.deliveredAt?.toDate(),
          readAt: data.readAt?.toDate()
        } as NotificationItem);
      });

      setNotifications(prev => [...prev, ...additionalNotifications]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 20);
    });
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notification_history', notificationId), {
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notification_history', notificationId), {
        readAt: null
      });
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notification_history', notificationId), {
        archived: true
      });
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchTerm === '' ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;

    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'today' && new Date(notification.createdAt).toDateString() === new Date().toDateString()) ||
      (dateFilter === 'week' && notification.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' && notification.createdAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'push':
        return <Smartphone className="h-4 w-4 text-blue-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-green-500" />;
      case 'sms':
        return <Bell className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'push':
        return 'Notification push';
      case 'email':
        return 'Email';
      case 'sms':
        return 'SMS';
      default:
        return type;
    }
  };

  const getStatusIcon = (status: string, readAt?: Date) => {
    if (readAt) {
      return <Eye className="h-4 w-4 text-gray-400" />;
    }

    switch (status) {
      case 'sent':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string, readAt?: Date) => {
    if (readAt) return 'Lu';

    switch (status) {
      case 'sent':
        return 'Envoyé';
      case 'delivered':
        return 'Livré';
      case 'failed':
        return 'Échec';
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 24 * 7) return `Il y a ${Math.floor(diffInHours / 24)}j`;
    return formatDate(date);
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Chargement des notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Historique des Notifications
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Toutes vos communications et mises à jour
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
              isDarkMode
                ? 'text-gray-300 bg-gray-700 hover:bg-gray-600'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            } border-gray-300`}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-3 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-md ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">Tous les types</option>
              <option value="push">Notifications push</option>
              <option value="email">Emails</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">Tous les statuts</option>
              <option value="sent">Envoyé</option>
              <option value="delivered">Livré</option>
              <option value="failed">Échec</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className={`rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="divide-y divide-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Aucune notification
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {notifications.length === 0
                  ? 'Vous n\'avez pas encore reçu de notifications.'
                  : 'Aucune notification ne correspond à vos critères de recherche.'
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  notification.readAt ? 'opacity-75' : ''
                } ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`text-sm font-medium ${
                          notification.readAt
                            ? isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            : isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          notification.readAt
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {getTypeLabel(notification.type)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          notification.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : notification.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusLabel(notification.status, notification.readAt)}
                        </span>
                      </div>

                      <p className={`text-sm ${
                        notification.readAt
                          ? isDarkMode ? 'text-gray-500' : 'text-gray-600'
                          : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      } mb-2`}>
                        {notification.message}
                      </p>

                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                        <p>{formatRelativeTime(notification.createdAt)}</p>
                        {notification.ticketNumber && (
                          <p>Réparation #{notification.ticketNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {notification.readAt ? (
                      <button
                        onClick={() => markAsUnread(notification.id)}
                        className={`p-1 rounded-md ${
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                        title="Marquer comme non lu"
                      >
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      </button>
                    ) : (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className={`p-1 rounded-md ${
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                        title="Marquer comme lu"
                      >
                        <Eye className="h-4 w-4 text-blue-500" />
                      </button>
                    )}

                    <button
                      onClick={() => archiveNotification(notification.id)}
                      className={`p-1 rounded-md ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                      title="Archiver"
                    >
                      <Archive className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && filteredNotifications.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 text-center">
            <button
              onClick={loadMore}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
            >
              Charger plus
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
