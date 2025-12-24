import { create } from 'zustand';
import { User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface CustomerProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  preferredLanguage: 'fr' | 'en';
  notificationPreferences: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
  };
  fcmTokens: string[];
  createdAt: string;
  lastLoginAt: string;
}

export interface CustomerTicket {
  id: string;
  ticketNumber: string;
  clientId: string;
  deviceType: string;
  brand: string;
  model: string;
  issue?: string;
  status: 'pending' | 'in-progress' | 'completed';
  cost: number;
  technicianId: string;
  passcode?: string;
  imeiSerial?: string;
  paymentStatus?: 'not_paid' | 'partially_paid' | 'fully_paid';
  amountPaid?: number;
  createdAt: string;
  updatedAt: string;
  estimatedCompletion?: string;
}

export interface NotificationItem {
  id: string;
  customerId: string;
  ticketId: string;
  type: 'status_change' | 'estimated_completion' | 'ready_for_pickup';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface CustomerState {
  // Authentication state
  user: User | null;
  profile: CustomerProfile | null;
  loading: boolean;
  error: string | null;

  // Customer data
  tickets: CustomerTicket[];
  notifications: NotificationItem[];
  unreadCount: number;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: CustomerProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Data fetching
  fetchProfile: () => Promise<void>;
  fetchTickets: () => Promise<void>;
  fetchNotifications: () => Promise<void>;

  // Real-time subscriptions
  subscribeToTickets: () => () => void;
  subscribeToNotifications: () => () => void;

  // Notification management
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Profile management
  updateProfile: (data: Partial<CustomerProfile>) => Promise<void>;
  updateNotificationPreferences: (preferences: CustomerProfile['notificationPreferences']) => Promise<void>;

  // Cleanup
  reset: () => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  // Initial state
  user: null,
  profile: null,
  loading: false,
  error: null,
  tickets: [],
  notifications: [],
  unreadCount: 0,

  // Basic setters
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Data fetching
  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    set({ loading: true, error: null });
    try {
      const profileDoc = await getDoc(doc(db, 'customer_profiles', user.uid));
      if (profileDoc.exists()) {
        const profile = profileDoc.data() as CustomerProfile;
        set({ profile, loading: false });
      } else {
        set({ error: 'Profile not found', loading: false });
      }
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      set({ error: 'Failed to fetch profile', loading: false });
    }
  },

  fetchTickets: async () => {
    const { profile } = get();
    if (!profile) return;

    set({ loading: true, error: null });
    try {
      // First, find all clients that match the customer's email
      const clientsQuery = query(
        collection(db, 'clients'),
        where('email', '==', profile.email)
      );

      const clientsSnapshot = await getDocs(clientsQuery);
      const clientIds = clientsSnapshot.docs.map(doc => doc.id);

      if (clientIds.length === 0) {
        // No clients found for this customer email
        set({ tickets: [], loading: false });
        return;
      }

      // Now fetch tickets for all matching client IDs
      const ticketsPromises = clientIds.map(clientId =>
        getDocs(query(
          collection(db, 'tickets'),
          where('clientId', '==', clientId)
        ))
      );

      const ticketsSnapshots = await Promise.all(ticketsPromises);
      const tickets: CustomerTicket[] = [];

      ticketsSnapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          tickets.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() :
                      (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() :
                     (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString())
          } as CustomerTicket);
        });
      });

      // Sort tickets by creation date (newest first)
      tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      set({ tickets, loading: false });
    } catch (error) {
      console.error('Error fetching customer tickets:', error);
      set({ error: 'Failed to fetch tickets', loading: false });
    }
  },

  fetchNotifications: async () => {
    const { profile } = get();
    if (!profile) return;

    try {
      // For now, create mock notifications based on ticket status changes
      // In production, this would fetch from a notifications collection
      const { tickets } = get();
      const mockNotifications: NotificationItem[] = [];

      tickets.forEach(ticket => {
        // Create notifications for recent status changes
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(ticket.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceUpdate <= 7) { // Show notifications for last 7 days
          mockNotifications.push({
            id: `${ticket.id}-status-${ticket.status}`,
            customerId: profile.id,
            ticketId: ticket.id,
            type: 'status_change',
            title: `Statut mis à jour - ${ticket.deviceType} ${ticket.brand}`,
            message: `Votre réparation est maintenant ${getStatusLabel(ticket.status)}`,
            isRead: false, // In production, this would be stored
            createdAt: ticket.updatedAt
          });
        }
      });

      // Sort by creation date (newest first)
      mockNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const unreadCount = mockNotifications.filter(n => !n.isRead).length;

      set({ notifications: mockNotifications, unreadCount });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ error: 'Failed to fetch notifications' });
    }
  },

  // Real-time subscriptions
  subscribeToTickets: () => {
    const { profile } = get();
    if (!profile) return () => {};

    // For real-time subscriptions, we'll subscribe to all tickets and filter client-side
    // This is not ideal but necessary due to Firestore query limitations
    const ticketsQuery = collection(db, 'tickets');

    const unsubscribe = onSnapshot(ticketsQuery, async (snapshot) => {
      try {
        // First, find all clients that match the customer's email
        const clientsQuery = query(
          collection(db, 'clients'),
          where('email', '==', profile.email)
        );

        const clientsSnapshot = await getDocs(clientsQuery);
        const clientIds = clientsSnapshot.docs.map(doc => doc.id);

        if (clientIds.length === 0) {
          set({ tickets: [] });
          return;
        }

        // Filter tickets to only include those for our client's IDs
        const tickets = snapshot.docs
          .filter(doc => clientIds.includes(doc.data().clientId))
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() :
                        (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() :
                       (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString())
            } as CustomerTicket;
          });

        // Sort tickets by creation date (newest first)
        tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        set({ tickets });
        // Refresh notifications when tickets change
        get().fetchNotifications();
      } catch (error) {
        console.error('Error in ticket subscription:', error);
      }
    });

    return unsubscribe;
  },

  subscribeToNotifications: () => {
    // For now, notifications are derived from tickets
    // In production, this would subscribe to a notifications collection
    const unsubscribe = get().subscribeToTickets();
    return unsubscribe;
  },

  // Notification management
  markNotificationRead: async (id: string) => {
    set(state => ({
      notifications: state.notifications.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  },

  markAllNotificationsRead: async () => {
    set(state => ({
      notifications: state.notifications.map(notification => ({
        ...notification,
        isRead: true
      })),
      unreadCount: 0
    }));
  },

  // Profile management
  updateProfile: async (data: Partial<CustomerProfile>) => {
    const { profile, user } = get();
    if (!profile || !user) return;

    set({ loading: true, error: null });
    try {
      await setDoc(doc(db, 'customer_profiles', user.uid), {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      set({
        profile: { ...profile, ...data },
        loading: false
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      set({ error: 'Failed to update profile', loading: false });
    }
  },

  updateNotificationPreferences: async (preferences: CustomerProfile['notificationPreferences']) => {
    await get().updateProfile({ notificationPreferences: preferences });
  },

  // Cleanup
  reset: () => set({
    user: null,
    profile: null,
    tickets: [],
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null
  })
}));

// Helper function to get status labels
function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'en attente';
    case 'in-progress': return 'en cours';
    case 'completed': return 'terminée';
    default: return status;
  }
}
