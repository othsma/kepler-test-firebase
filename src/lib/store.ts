import { create } from 'zustand';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db, initializeSuperAdmin, ROLES } from './firebase';
import { User } from 'firebase/auth';
import { format } from 'date-fns';

interface QuoteItem {
  productId: string;
  quantity: number;
  name: string;
  description?: string;
  price: number;
  sku?: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  paymentMethod?: string;
  paymentStatus?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdFrom?: 'pos' | 'manual';
  convertedToSaleId?: string;
}

interface QuotesState {
  quotes: Quote[];
  loading: boolean;
  error: string | null;
  fetchQuotes: () => Promise<void>;
  createQuote: (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt' | 'validUntil' | 'status'>) => Promise<string>;
  updateQuote: (id: string, quoteData: Partial<Quote>) => Promise<void>;
  updateQuoteStatus: (id: string, status: Quote['status']) => Promise<void>;
  convertQuoteToSale: (quoteId: string) => Promise<string>;
  deleteQuote: (id: string) => Promise<void>;
}

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const useThemeStore = create<ThemeState>((set: any) => ({
  isDarkMode: false,
  toggleDarkMode: () => set((state: ThemeState) => ({ isDarkMode: !state.isDarkMode })),
}));

interface UserState {
  language: 'en' | 'es' | 'fr';
  setLanguage: (language: 'en' | 'es' | 'fr') => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const useUserStore = create<UserState>((set: any) => ({
  language: 'en',
  setLanguage: (language: 'en' | 'es' | 'fr') => set({ language }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state: UserState) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

interface AuthState {
  user: User | null;
  userRole: string | null;
  userProfile: any | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setUserRole: (role: string | null) => void;
  setUserProfile: (profile: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  clearError: () => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userRole: null,
  userProfile: null,
  loading: true,
  error: null,
  initialized: false,
  setUser: (user) => set({ user }),
  setUserRole: (role) => set({ userRole: role }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setInitialized: (initialized) => set({ initialized }),
  clearError: () => set({ error: null }),
  logout: () => set({ user: null, userRole: null, userProfile: null }),
}));

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customerCode?: string;
  linkedCustomerId?: string;
  linkedAt?: string;
  createdAt: string;
}

interface ClientsState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchClients: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<string>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  loading: false,
  error: null,
  searchQuery: '',
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  
  fetchClients: async () => {
    set({ loading: true, error: null });
    try {
      const clientsCollection = collection(db, 'clients');
      const clientsSnapshot = await getDocs(clientsCollection);
      const clientsList = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
      } as Client));
      
      set({ clients: clientsList, loading: false });
    } catch (error) {
      console.error('Error fetching clients:', error);
      set({ error: 'Failed to fetch clients', loading: false });
    }
  },
  
  addClient: async (client: Omit<Client, 'id' | 'createdAt'>) => {
    set({ loading: true, error: null });
    try {
      const clientData = {
        ...client,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'clients'), clientData);
      
      // Add the new client to the local state
      const newClient = {
        id: docRef.id,
        ...client,
        createdAt: new Date().toISOString()
      };
      
      set(state => ({
        clients: [...state.clients, newClient],
        loading: false
      }));
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding client:', error);
      set({ error: 'Failed to add client', loading: false });
      return '';
    }
  },
  
  updateClient: async (id: string, clientData: Partial<Client>) => {
    set({ loading: true, error: null });
    try {
      const clientRef = doc(db, 'clients', id);
      await updateDoc(clientRef, clientData);
      
      // Update the client in the local state
      set(state => ({
        clients: state.clients.map(client => 
          client.id === id ? { ...client, ...clientData } : client
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating client:', error);
      set({ error: 'Failed to update client', loading: false });
    }
  },
  
  deleteClient: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'clients', id));
      
      // Remove the client from the local state
      set(state => ({
        clients: state.clients.filter(client => client.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting client:', error);
      set({ error: 'Failed to delete client', loading: false });
    }
  }
}));

interface Model {
  id: string;
  name: string;
  brandId: string;
}

interface TicketSettings {
  deviceTypes: string[];
  brands: string[];
  models: Model[];
  tasks: string[];
}

// New interface for task with price
export interface TaskWithPrice {
  name: string;
  price: number;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  clientId: string;
  deviceType: string;
  brand: string;
  model: string;
  tasks: string[];
  taskPrices?: TaskWithPrice[]; // Add task prices array
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
}

interface TicketsState {
  tickets: Ticket[];
  settings: TicketSettings;
  loading: boolean;
  error: string | null;
  fetchTickets: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  addTicket: (ticket: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTicket: (id: string, ticket: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  filterStatus: 'all' | 'pending' | 'in-progress' | 'completed';
  setFilterStatus: (status: 'all' | 'pending' | 'in-progress' | 'completed') => void;
  addDeviceType: (type: string) => Promise<void>;
  removeDeviceType: (type: string) => Promise<void>;
  updateDeviceType: (oldType: string, newType: string) => Promise<void>;
  addBrand: (brand: string) => Promise<void>;
  removeBrand: (brand: string) => Promise<void>;
  updateBrand: (oldBrand: string, newBrand: string) => Promise<void>;
  addModel: (model: { name: string; brandId: string }) => Promise<void>;
  removeModel: (modelId: string) => Promise<void>;
  updateModel: (modelId: string, name: string) => Promise<void>;
  addTask: (task: string) => Promise<void>;
  removeTask: (task: string) => Promise<void>;
  updateTask: (oldTask: string, newTask: string) => Promise<void>;
  assignTicket: (ticketId: string, technicianId: string) => Promise<void>;
  fetchTechnicianTickets: (technicianId: string) => Promise<void>;
}

const generateTicketNumber = () => {
  const month = new Date().toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${month}${randomNum}`;
};

const useTicketsStore = create<TicketsState>((set, get) => ({
  tickets: [],
  settings: {
    deviceTypes: [],
    brands: [],
    models: [],
    tasks: [],
  },
  loading: false,
  error: null,
  filterStatus: 'all',
  
  setFilterStatus: (status: 'all' | 'pending' | 'in-progress' | 'completed') => set({ filterStatus: status }),
  
  fetchTickets: async () => {
    set({ loading: true, error: null });
    try {
      const userRole = useAuthStore.getState().userRole;
      const user = useAuthStore.getState().user;
      
      let ticketsCollection;
      
      // If user is a technician, only fetch their assigned tickets
      if (userRole === ROLES.TECHNICIAN && user) {
        ticketsCollection = query(
          collection(db, 'tickets'),
          where('technicianId', '==', user.uid)
        );
      } else {
        // Super admin can see all tickets
        ticketsCollection = collection(db, 'tickets');
      }
      
      const ticketsSnapshot = await getDocs(ticketsCollection);
      const ticketsList = ticketsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString()
        } as Ticket;
      });
      
      set({ tickets: ticketsList, loading: false });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      set({ error: 'Failed to fetch tickets', loading: false });
    }
  },
  
  fetchTechnicianTickets: async (technicianId: string) => {
    set({ loading: true, error: null });
    try {
      const ticketsCollection = query(
        collection(db, 'tickets'),
        where('technicianId', '==', technicianId)
      );
      
      const ticketsSnapshot = await getDocs(ticketsCollection);
      const ticketsList = ticketsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString()
        } as Ticket;
      });
      
      set({ tickets: ticketsList, loading: false });
    } catch (error) {
      console.error('Error fetching technician tickets:', error);
      set({ error: 'Failed to fetch technician tickets', loading: false });
    }
  },
  
  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch device types
      const deviceTypesDoc = await getDocs(collection(db, 'settings', 'ticket', 'deviceTypes'));
      const deviceTypes = deviceTypesDoc.docs.map(doc => doc.data().name);
      
      // Fetch brands
      const brandsDoc = await getDocs(collection(db, 'settings', 'ticket', 'brands'));
      const brands = brandsDoc.docs.map(doc => doc.data().name);
      
      // Fetch models
      const modelsDoc = await getDocs(collection(db, 'settings', 'ticket', 'models'));
      const models = modelsDoc.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        brandId: doc.data().brandId
      }));
      
      // Fetch tasks
      const tasksDoc = await getDocs(collection(db, 'settings', 'ticket', 'tasks'));
      const tasks = tasksDoc.docs.map(doc => doc.data().name);
      
      set({ 
        settings: {
          deviceTypes,
          brands,
          models,
          tasks
        },
        loading: false 
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      set({ error: 'Failed to fetch settings', loading: false });
    }
  },
  
  addTicket: async (ticket: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => {
    set({ loading: true, error: null });
    try {
      const ticketNumber = generateTicketNumber();
      
      const ticketData = {
        ...ticket,
        ticketNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add ticket to Firestore
      const docRef = await addDoc(collection(db, 'tickets'), ticketData);
      
      // Add the new ticket to the local state
      const newTicket = {
        id: docRef.id,
        ticketNumber,
        ...ticket,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        tickets: [...state.tickets, newTicket],
        loading: false
      }));
      
      return ticketNumber;
    } catch (error) {
      console.error('Error adding ticket:', error);
      set({ error: 'Failed to add ticket', loading: false });
      return '';
    }
  },
  
  updateTicket: async (id: string, ticketData: Partial<Ticket>) => {
    set({ loading: true, error: null });
    try {
      const ticketRef = doc(db, 'tickets', id);
      
      // Add updatedAt timestamp
      const updateData = {
        ...ticketData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(ticketRef, updateData);
      
      // Update the ticket in the local state
      set(state => ({
        tickets: state.tickets.map(ticket => 
          ticket.id === id 
            ? { 
                ...ticket, 
                ...ticketData, 
                updatedAt: new Date().toISOString() 
              } 
            : ticket
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating ticket:', error);
      set({ error: 'Failed to update ticket', loading: false });
    }
  },
  
  assignTicket: async (ticketId: string, technicianId: string) => {
    set({ loading: true, error: null });
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      
      const updateData = {
        technicianId,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(ticketRef, updateData);
      
      // Update the ticket in the local state
      set(state => ({
        tickets: state.tickets.map(ticket => 
          ticket.id === ticketId 
            ? { 
                ...ticket, 
                technicianId, 
                updatedAt: new Date().toISOString() 
              } 
            : ticket
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error assigning ticket:', error);
      set({ error: 'Failed to assign ticket', loading: false });
    }
  },
  
  deleteTicket: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'tickets', id));
      
      // Remove the ticket from the local state
      set(state => ({
        tickets: state.tickets.filter(ticket => ticket.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting ticket:', error);
      set({ error: 'Failed to delete ticket', loading: false });
    }
  },
  
  addDeviceType: async (type: string) => {
    // Save current state to restore in case of error
    const currentState = get();
    
    try {
      // Optimistically update the state first
      set(state => ({
        settings: {
          ...state.settings,
          deviceTypes: [...state.settings.deviceTypes, type]
        }
      }));
      
      // Then perform the async operation
      await addDoc(collection(db, 'settings', 'ticket', 'deviceTypes'), { name: type });
    } catch (error) {
      console.error('Error adding device type:', error);
      
      // Restore previous state on error
      set({
        settings: currentState.settings,
        error: 'Failed to add device type'
      });
    }
  },
  
  removeDeviceType: async (type: string) => {
    try {
      const deviceTypesRef = collection(db, 'settings', 'ticket', 'deviceTypes');
      const q = query(deviceTypesRef, where('name', '==', type));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'settings', 'ticket', 'deviceTypes', document.id));
      });
      
      set(state => ({
        settings: {
          ...state.settings,
          deviceTypes: state.settings.deviceTypes.filter(t => t !== type)
        }
      }));
    } catch (error) {
      console.error('Error removing device type:', error);
      set({ error: 'Failed to remove device type' });
    }
  },
  
  updateDeviceType: async (oldType: string, newType: string) => {
    try {
      const deviceTypesRef = collection(db, 'settings', 'ticket', 'deviceTypes');
      const q = query(deviceTypesRef, where('name', '==', oldType));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        await updateDoc(doc(db, 'settings', 'ticket', 'deviceTypes', document.id), {
          name: newType
        });
      });
      
      set(state => ({
        settings: {
          ...state.settings,
          deviceTypes: state.settings.deviceTypes.map(t => t === oldType ? newType : t)
        }
      }));
    } catch (error) {
      console.error('Error updating device type:', error);
      set({ error: 'Failed to update device type' });
    }
  },
  
  addBrand: async (brand: string) => {
    // Save current state to restore in case of error
    const currentState = get();
    
    try {
      // Optimistically update the state first
      set(state => ({
        settings: {
          ...state.settings,
          brands: [...state.settings.brands, brand]
        }
      }));
      
      // Then perform the async operation
      await addDoc(collection(db, 'settings', 'ticket', 'brands'), { name: brand });
    } catch (error) {
      console.error('Error adding brand:', error);
      
      // Restore previous state on error
      set({
        settings: currentState.settings,
        error: 'Failed to add brand'
      });
    }
  },
  
  removeBrand: async (brand: string) => {
    try {
      const brandsRef = collection(db, 'settings', 'ticket', 'brands');
      const q = query(brandsRef, where('name', '==', brand));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'settings', 'ticket', 'brands', document.id));
      });
      
      // Also remove all models associated with this brand
      const modelsRef = collection(db, 'settings', 'ticket', 'models');
      const modelsQuery = query(modelsRef, where('brandId', '==', brand));
      const modelsSnapshot = await getDocs(modelsQuery);
      
      modelsSnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'settings', 'ticket', 'models', document.id));
      });
      
      set(state => ({
        settings: {
          ...state.settings,
          brands: state.settings.brands.filter(b => b !== brand),
          models: state.settings.models.filter(m => m.brandId !== brand)
        }
      }));
    } catch (error) {
      console.error('Error removing brand:', error);
      set({ error: 'Failed to remove brand' });
    }
  },
  
  updateBrand: async (oldBrand: string, newBrand: string) => {
    try {
      // Update the brand
      const brandsRef = collection(db, 'settings', 'ticket', 'brands');
      const q = query(brandsRef, where('name', '==', oldBrand));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        await updateDoc(doc(db, 'settings', 'ticket', 'brands', document.id), {
          name: newBrand
        });
      });
      
      // Update all models associated with this brand
      const modelsRef = collection(db, 'settings', 'ticket', 'models');
      const modelsQuery = query(modelsRef, where('brandId', '==', oldBrand));
      const modelsSnapshot = await getDocs(modelsQuery);
      
      modelsSnapshot.forEach(async (document) => {
        await updateDoc(doc(db, 'settings', 'ticket', 'models', document.id), {
          brandId: newBrand
        });
      });
      
      set(state => ({
        settings: {
          ...state.settings,
          brands: state.settings.brands.map(b => b === oldBrand ? newBrand : b),
          models: state.settings.models.map(m => 
            m.brandId === oldBrand ? { ...m, brandId: newBrand } : m
          )
        }
      }));
    } catch (error) {
      console.error('Error updating brand:', error);
      set({ error: 'Failed to update brand' });
    }
  },
  
  addModel: async (model: { name: string; brandId: string }) => {
    // Save current state to restore in case of error
    const currentState = get();
    
    try {
      // Create a temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      
      // Optimistically update the state first
      set(state => ({
        settings: {
          ...state.settings,
          models: [
            ...state.settings.models,
            { ...model, id: tempId }
          ]
        }
      }));
      
      // Then perform the async operation
      const docRef = await addDoc(collection(db, 'settings', 'ticket', 'models'), model);
      
      // Update with the real ID
      set(state => ({
        settings: {
          ...state.settings,
          models: state.settings.models.map(m => 
            m.id === tempId ? { ...model, id: docRef.id } : m
          )
        }
      }));
    } catch (error) {
      console.error('Error adding model:', error);
      
      // Restore previous state on error
      set({
        settings: currentState.settings,
        error: 'Failed to add model'
      });
    }
  },
  
  removeModel: async (modelId: string) => {
    try {
      await deleteDoc(doc(db, 'settings', 'ticket', 'models', modelId));
      
      set(state => ({
        settings: {
          ...state.settings,
          models: state.settings.models.filter(m => m.id !== modelId)
        }
      }));
    } catch (error) {
      console.error('Error removing model:', error);
      set({ error: 'Failed to remove model' });
    }
  },
  
  updateModel: async (modelId: string, name: string) => {
    try {
      await updateDoc(doc(db, 'settings', 'ticket', 'models', modelId), { name });
      
      set(state => ({
        settings: {
          ...state.settings,
          models: state.settings.models.map(m => 
            m.id === modelId ? { ...m, name } : m
          )
        }
      }));
    } catch (error) {
      console.error('Error updating model:', error);
      set({ error: 'Failed to update model' });
    }
  },
  
  addTask: async (task: string) => {
    // Save current state to restore in case of error
    const currentState = get();
    
    try {
      // Optimistically update the state first
      set(state => ({
        settings: {
          ...state.settings,
          tasks: [...state.settings.tasks, task]
        }
      }));
      
      // Then perform the async operation
      await addDoc(collection(db, 'settings', 'ticket', 'tasks'), { name: task });
    } catch (error) {
      console.error('Error adding task:', error);
      
      // Restore previous state on error
      set({
        settings: currentState.settings,
        error: 'Failed to add task'
      });
    }
  },
  
  removeTask: async (task: string) => {
    try {
      const tasksRef = collection(db, 'settings', 'ticket', 'tasks');
      const q = query(tasksRef, where('name', '==', task));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'settings', 'ticket', 'tasks', document.id));
      });
      
      set(state => ({
        settings: {
          ...state.settings,
          tasks: state.settings.tasks.filter(t => t !== task)
        }
      }));
    } catch (error) {
      console.error('Error removing task:', error);
      set({ error: 'Failed to remove task' });
    }
  },
  
  updateTask: async (oldTask: string, newTask: string) => {
    try {
      const tasksRef = collection(db, 'settings', 'ticket', 'tasks');
      const q = query(tasksRef, where('name', '==', oldTask));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        await updateDoc(doc(db, 'settings', 'ticket', 'tasks', document.id), {
          name: newTask
        });
      });
      
      set(state => ({
        settings: {
          ...state.settings,
          tasks: state.settings.tasks.map(t => t === oldTask ? newTask : t)
        }
      }));
    } catch (error) {
      console.error('Error updating task:', error);
      set({ error: 'Failed to update task' });
    }
  }
}));

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}

interface ProductsState {
  products: Product[];
  categories: string[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (id: string, quantity: number) => Promise<void>;
}

const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  categories: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: 'all',
  
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category: string) => set({ selectedCategory: category }),
  
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      
      set({ products: productsList, loading: false });
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ error: 'Failed to fetch products', loading: false });
    }
  },
  
  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const categoriesCollection = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesCollection);
      const categoriesList = categoriesSnapshot.docs.map(doc => doc.data().name);
      
      set({ categories: categoriesList, loading: false });
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({ error: 'Failed to fetch categories', loading: false });
    }
  },
  
  addProduct: async (product: Omit<Product, 'id'>) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'products'), product);
      
      // Add the new product to the local state
      const newProduct = {
        id: docRef.id,
        ...product
      };
      
      set(state => ({
        products: [...state.products, newProduct],
        loading: false
      }));
      
      // Check if the category exists, if not add it
      const { categories } = get();
      if (!categories.includes(product.category)) {
        await addDoc(collection(db, 'categories'), { name: product.category });
        set(state => ({
          categories: [...state.categories, product.category]
        }));
      }
    } catch (error) {
      console.error('Error adding product:', error);
      set({ error: 'Failed to add product', loading: false });
    }
  },
  
  updateProduct: async (id: string, productData: Partial<Product>) => {
    set({ loading: true, error: null });
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, productData);
      
      // Update the product in the local state
      set(state => ({
        products: state.products.map(product => 
          product.id === id ? { ...product, ...productData } : product
        ),
        loading: false
      }));
      
      // If category changed, check if the new category exists
      if (productData.category) {
        const { categories } = get();
        if (!categories.includes(productData.category)) {
          await addDoc(collection(db, 'categories'), { name: productData.category });
          set(state => ({
            categories: [...state.categories, productData.category as string]
          }));
        }
      }
    } catch (error) {
      console.error('Error updating product:', error);
      set({ error: 'Failed to update product', loading: false });
    }
  },
  
  deleteProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'products', id));
      
      // Remove the product from the local state
      set(state => ({
        products: state.products.filter(product => product.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting product:', error);
      set({ error: 'Failed to delete product', loading: false });
    }
  },
  
  updateStock: async (id: string, quantity: number) => {
    set({ loading: true, error: null });
    try {
      const productRef = doc(db, 'products', id);
      const product = get().products.find(p => p.id === id);
      
      if (product) {
        const newStock = product.stock + quantity;
        await updateDoc(productRef, { stock: newStock });
        
        // Update the product in the local state
        set(state => ({
          products: state.products.map(p => 
            p.id === id ? { ...p, stock: newStock } : p
          ),
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      set({ error: 'Failed to update stock', loading: false });
    }
  }
}));




interface SaleItem {
  productId: string;
  quantity: number;
  name: string;
  description?: string;
  price: number;
  sku?: string;
}

interface Sale {
  id: string;
  invoiceNumber: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  date: string;
  note?: string;
  createdAt: string;
}

interface SalesState {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  fetchSales: () => Promise<void>;
  createSale: (saleData: Omit<Sale, 'id' | 'createdAt'>) => Promise<string>;
  deleteSale: (id: string) => Promise<void>;
}




interface PosState {
  showReceipt: boolean;
  currentInvoice: any;
  setShowReceipt: (show: boolean) => void;
  setCurrentInvoice: (invoice: any) => void;
  clearReceipt: () => void;
}

const usePosStore = create<PosState>((set) => ({
  showReceipt: false,
  currentInvoice: null,
  setShowReceipt: (show: boolean) => set({ showReceipt: show }),
  setCurrentInvoice: (invoice: any) => set({ currentInvoice: invoice }),
  clearReceipt: () => set({ showReceipt: false, currentInvoice: null }),
}));

const useSalesStore = create<SalesState>((set) => ({
  sales: [],
  loading: false,
  error: null,

  fetchSales: async () => {
    set({ loading: true, error: null });
    try {
      const salesCollection = collection(db, 'sales');
      const salesSnapshot = await getDocs(salesCollection);
      const salesList = salesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        } as Sale;
      });

      set({ sales: salesList, loading: false });
    } catch (error) {
      console.error('Error fetching sales:', error);
      set({ error: 'Failed to fetch sales', loading: false });
    }
  },

  createSale: async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    set({ loading: true, error: null });
    try {
      // Prepare sale document, filtering out undefined values
      const saleDoc: any = {
        invoiceNumber: saleData.invoiceNumber,
        items: saleData.items,
        subtotal: saleData.subtotal,
        tax: saleData.tax,
        total: saleData.total,
        paymentMethod: saleData.paymentMethod,
        paymentStatus: saleData.paymentStatus,
        date: saleData.date,
        createdAt: new Date()
      };

      // Only include optional fields if they have values
      if (saleData.customer) {
        saleDoc.customer = saleData.customer;
      }
      if (saleData.note) {
        saleDoc.note = saleData.note;
      }

      console.log('Creating sale with data:', saleDoc);
      const docRef = await addDoc(collection(db, 'sales'), saleDoc);
      console.log('Sale created with ID:', docRef.id);

      // Create sale object for local state
      const newSale = {
        id: docRef.id,
        ...saleData,
        createdAt: new Date().toISOString()
      };

      // Update local state
      set(state => ({
        sales: [...state.sales, newSale],
        loading: false
      }));

      return docRef.id;
    } catch (error) {
      console.error('Error creating sale:', error);
      set({ error: 'Failed to create sale', loading: false });
      return '';
    }
  },

  deleteSale: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'sales', id));

      set(state => ({
        sales: state.sales.filter(sale => sale.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting sale:', error);
      set({ error: 'Failed to delete sale', loading: false });
    }
  }
}));

const generateQuoteNumber = () => {
  const date = format(new Date(), 'yyMMdd');
  const random = Math.floor(100 + Math.random() * 900);
  return `Q-${date}-${random}`;
};

const useQuotesStore = create<QuotesState>((set, get) => ({
  quotes: [],
  loading: false,
  error: null,

  fetchQuotes: async () => {
    set({ loading: true, error: null });
    try {
      const quotesCollection = collection(db, 'quotes');
      const quotesSnapshot = await getDocs(quotesCollection);
      const quotesList = quotesSnapshot.docs.map(doc => {
        const data = doc.data();

        // Safely handle timestamp fields
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() :
                        (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString());

        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() :
                        (typeof data.updatedAt === 'string' ? data.updatedAt : createdAt);

        const validUntil = data.validUntil?.toDate ? data.validUntil.toDate().toISOString() :
                         (typeof data.validUntil === 'string' ? data.validUntil : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt,
          validUntil
        } as Quote;
      });

      set({ quotes: quotesList, loading: false });
      console.log('Fetched quotes:', quotesList.length);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      set({ error: 'Failed to fetch quotes', loading: false });
    }
  },

  createQuote: async (quoteData) => {
    set({ loading: true, error: null });
    try {
      const quoteNumber = generateQuoteNumber();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30); // 30 days validity

      // Explicitly construct quote document to ensure all fields are included
      const quoteDoc: any = {
        items: quoteData.items,
        subtotal: quoteData.subtotal,
        tax: quoteData.tax,
        total: quoteData.total,
        quoteNumber,
        status: 'draft' as const,
        validUntil: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdFrom: 'pos' as const
      };

      // Only include optional fields if they have values
      if (quoteData.customer) {
        quoteDoc.customer = quoteData.customer;
      }
      if (quoteData.paymentMethod) {
        quoteDoc.paymentMethod = quoteData.paymentMethod;
      }
      if (quoteData.paymentStatus) {
        quoteDoc.paymentStatus = quoteData.paymentStatus;
      }
      if (quoteData.notes) {
        quoteDoc.notes = quoteData.notes;
      }

      const docRef = await addDoc(collection(db, 'quotes'), quoteDoc);
      console.log('Quote created with ID:', docRef.id);

      // Create quote object for local state
      const newQuote = {
        id: docRef.id,
        ...quoteData,
        quoteNumber,
        status: 'draft' as const,
        validUntil: validUntil.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdFrom: 'pos' as const
      };

      // Update local state
      set(state => ({
        quotes: [...state.quotes, newQuote],
        loading: false
      }));

      return docRef.id;
    } catch (error) {
      console.error('Error creating quote:', error);
      set({ error: 'Failed to create quote', loading: false });
      return '';
    }
  },

  updateQuote: async (id: string, quoteData: Partial<Quote>) => {
    console.log('=== STORE updateQuote START ===');
    console.log('Quote ID:', id);
    console.log('Quote data:', quoteData);

    set({ loading: true, error: null });
    try {
      const quoteRef = doc(db, 'quotes', id);
      console.log('Quote reference:', quoteRef);

      const updateData = {
        ...quoteData,
        updatedAt: serverTimestamp()
      };
      console.log('Final update data:', updateData);

      console.log('Calling updateDoc...');
      await updateDoc(quoteRef, updateData);
      console.log('updateDoc completed successfully');

      // Update the quote in the local state
      set(state => {
        const updatedQuotes = state.quotes.map(quote =>
          quote.id === id
            ? { ...quote, ...quoteData, updatedAt: new Date().toISOString() }
            : quote
        );
        console.log('Updated local state quotes count:', updatedQuotes.length);
        return {
          quotes: updatedQuotes,
          loading: false
        };
      });

      console.log('=== STORE updateQuote END ===');
    } catch (error) {
      console.error('=== STORE updateQuote ERROR ===');
      console.error('Error updating quote:', error);
      set({ error: 'Failed to update quote', loading: false });
      throw error; // Re-throw so the caller can handle it
    }
  },

  updateQuoteStatus: async (id: string, status: Quote['status']) => {
    set({ loading: true, error: null });
    try {
      const quoteRef = doc(db, 'quotes', id);

      const updateData = {
        status,
        updatedAt: serverTimestamp()
      };

      await updateDoc(quoteRef, updateData);

      // Update the quote in the local state
      set(state => ({
        quotes: state.quotes.map(quote =>
          quote.id === id
            ? { ...quote, status, updatedAt: new Date().toISOString() }
            : quote
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating quote status:', error);
      set({ error: 'Failed to update quote status', loading: false });
    }
  },

  convertQuoteToSale: async (quoteId: string) => {
    set({ loading: true, error: null });
    try {
      const { quotes } = get();
      const quote = quotes.find(q => q.id === quoteId);

      if (!quote) {
        throw new Error('Quote not found');
      }

      // Generate invoice ID
      const prefix = 'INV';
      const date = format(new Date(), 'yyMMdd');
      const random = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `${prefix}-${date}-${random}`;

      // Create sale from quote - use payment method and status from quote
      const saleData = {
        invoiceNumber,
        items: quote.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          name: item.name,
          sku: item.sku,
          price: item.price,
        })),
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        customer: quote.customer,
        paymentMethod: quote.paymentMethod || 'cash', // Use quote's payment method or default to cash
        paymentStatus: 'Paid', // When converted to sale, it's paid
        date: new Date().toISOString(),
        note: `Issu du devis numéro ${quote.quoteNumber}`
      };

      // Create sale in Firestore
      const saleDoc = {
        ...saleData,
        createdAt: new Date()
      };

      const saleDocRef = await addDoc(collection(db, 'sales'), saleDoc);

      // Update quote status and link to sale
      const quoteRef = doc(db, 'quotes', quoteId);
      await updateDoc(quoteRef, {
        status: 'accepted',
        convertedToSaleId: saleDocRef.id,
        updatedAt: serverTimestamp()
      });

      // Update local state
      set(state => ({
        quotes: state.quotes.map(q =>
          q.id === quoteId
            ? { ...q, status: 'accepted' as const, convertedToSaleId: saleDocRef.id, updatedAt: new Date().toISOString() }
            : q
        ),
        loading: false
      }));

      return saleDocRef.id;
    } catch (error) {
      console.error('Error converting quote to sale:', error);
      set({ error: 'Failed to convert quote to sale', loading: false });
      return '';
    }
  },

  deleteQuote: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'quotes', id));

      set(state => ({
        quotes: state.quotes.filter(quote => quote.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting quote:', error);
      set({ error: 'Failed to delete quote', loading: false });
    }
  }
}));

// Export all stores
export {
  useThemeStore,
  useUserStore,
  useAuthStore,
  useClientsStore,
  useTicketsStore,
  useProductsStore,
  useSalesStore,
  usePosStore,
  useQuotesStore
};

// Initialize the super admin account
initializeSuperAdmin();
