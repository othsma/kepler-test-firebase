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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth, initializeSuperAdmin, ROLES } from './firebase';
import { User } from 'firebase/auth';

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeState>((set: any) => ({
  isDarkMode: false,
  toggleDarkMode: () => set((state: ThemeState) => ({ isDarkMode: !state.isDarkMode })),
}));

interface UserState {
  language: 'en' | 'es' | 'fr';
  setLanguage: (language: 'en' | 'es' | 'fr') => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUserStore = create<UserState>((set: any) => ({
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

export const useAuthStore = create<AuthState>((set) => ({
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

export const useClientsStore = create<ClientsState>((set, get) => ({
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

export const useTicketsStore = create<TicketsState>((set, get) => ({
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
      const ticketRef = doc(db, 'tickets', id);
      
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
    try {
      await addDoc(collection(db, 'settings', 'ticket', 'deviceTypes'), { name: type });
      
      set(state => ({
        settings: {
          ...state.settings,
          deviceTypes: [...state.settings.deviceTypes, type]
        }
      }));
    } catch (error) {
      console.error('Error adding device type:', error);
      set({ error: 'Failed to add device type' });
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
    try {
      await addDoc(collection(db, 'settings', 'ticket', 'brands'), { name: brand });
      
      set(state => ({
        settings: {
          ...state.settings,
          brands: [...state.settings.brands, brand]
        }
      }));
    } catch (error) {
      console.error('Error adding brand:', error);
      set({ error: 'Failed to add brand' });
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
    try {
      const docRef = await addDoc(collection(db, 'settings', 'ticket', 'models'), model);
      
      set(state => ({
        settings: {
          ...state.settings,
          models: [
            ...state.settings.models,
            { ...model, id: docRef.id }
          ]
        }
      }));
    } catch (error) {
      console.error('Error adding model:', error);
      set({ error: 'Failed to add model' });
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
    try {
      await addDoc(collection(db, 'settings', 'ticket', 'tasks'), { name: task });
      
      set(state => ({
        settings: {
          ...state.settings,
          tasks: [...state.settings.tasks, task]
        }
      }));
    } catch (error) {
      console.error('Error adding task:', error);
      set({ error: 'Failed to add task' });
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

export const useProductsStore = create<ProductsState>((set, get) => ({
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

interface OrderItem {
  productId: string;
  quantity: number;
  name?: string;
  description?: string;
  price?: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'ready_for_pickup' | 'completed' | 'cancelled';
  clientId: string;
  createdAt: string;
  paymentMethod?: string;
  paymentStatus?: string;
  amountPaid?: number;
  orderDate?: string;
  deliveryDate?: string;
  note?: string;
}

interface OrdersState {
  orders: Order[];
  cart: OrderItem[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  createOrder: (clientId: string, total: number, items?: OrderItem[]) => Promise<string>;
  updateOrder: (orderId: string, orderData: Partial<Order>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  cart: [],
  loading: false,
  error: null,
  
  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const ordersCollection = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersCollection);
      const ordersList = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString()
        } as Order;
      });
      
      set({ orders: ordersList, loading: false });
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ error: 'Failed to fetch orders', loading: false });
    }
  },
  
  addToCart: (productId: string, quantity: number) => {
    set(state => ({
      cart: [
        ...state.cart.filter(item => item.productId !== productId),
        { productId, quantity }
      ]
    }));
  },
  
  removeFromCart: (productId: string) => {
    set(state => ({
      cart: state.cart.filter(item => item.productId !== productId)
    }));
  },
  
  clearCart: () => set({ cart: [] }),
  
  createOrder: async (clientId: string, total: number, items?: OrderItem[]) => {
    set({ loading: true, error: null });
    try {
      const { cart } = get();
      
      const orderItems = items || [...cart];
      
      const orderData = {
        items: orderItems,
        total,
        status: 'pending' as const,
        clientId,
        createdAt: serverTimestamp(),
        paymentMethod: 'cash',
        paymentStatus: 'not_paid',
        amountPaid: 0,
        orderDate: new Date().toISOString(),
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Update product stock
      for (const item of orderItems) {
        if (item.productId && item.productId !== 'custom') {
          const productRef = doc(db, 'products', item.productId);
          const productsState = useProductsStore.getState();
          const product = productsState.products.find(p => p.id === item.productId);
          
          if (product) {
            await updateDoc(productRef, {
              stock: product.stock - item.quantity
            });
            
            // Update the product in the products store
            productsState.updateStock(item.productId, -item.quantity);
          }
        }
      }
      
      // Add the new order to the local state
      const newOrder = {
        id: docRef.id,
        items: orderItems,
        total,
        status: 'pending' as const,
        clientId,
        createdAt: new Date().toISOString(),
        paymentMethod: 'cash',
        paymentStatus: 'not_paid',
        amountPaid: 0,
        orderDate: new Date().toISOString(),
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      set(state => ({
        orders: [...state.orders, newOrder],
        cart: [],
        loading: false
      }));
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      set({ error: 'Failed to create order', loading: false });
      return '';
    }
  },
  
  updateOrder: async (orderId: string, orderData: Partial<Order>) => {
    set({ loading: true, error: null });
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, orderData);
      
      // Update the order in the local state
      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? { ...order, ...orderData } : order
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating order:', error);
      set({ error: 'Failed to update order', loading: false });
    }
  },
  
  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    set({ loading: true, error: null });
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status });
      
      // Update the order in the local state
      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? { ...order, status } : order
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating order status:', error);
      set({ error: 'Failed to update order status', loading: false });
    }
  },
  
  deleteOrder: async (orderId: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      
      // Remove the order from the local state
      set(state => ({
        orders: state.orders.filter(order => order.id !== orderId),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting order:', error);
      set({ error: 'Failed to delete order', loading: false });
    }
  }
}));

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  clientId: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

interface InvoicesState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  updateInvoiceStatus: (invoiceId: string, status: Invoice['status']) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
}

const generateInvoiceNumber = () => {
  const month = new Date().toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${month}${randomNum}`;
};

export const useInvoicesStore = create<InvoicesState>((set, get) => ({
  invoices: [],
  loading: false,
  error: null,
  
  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const invoicesCollection = collection(db, 'invoices');
      const invoicesSnapshot = await getDocs(invoicesCollection);
      const invoicesList = invoicesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate().toISOString() || new Date().toISOString(),
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString()
        } as Invoice;
      });
      
      set({ invoices: invoicesList, loading: false });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      set({ error: 'Failed to fetch invoices', loading: false });
    }
  },
  
  addInvoice: async (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
    set({ loading: true, error: null });
    try {
      const invoiceNumber = generateInvoiceNumber();
      
      const invoiceData = {
        ...invoice,
        invoiceNumber,
        createdAt: serverTimestamp(),
        date: Timestamp.fromDate(new Date(invoice.date))
      };
      
      const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
      
      // Add the new invoice to the local state
      const newInvoice = {
        id: docRef.id,
        invoiceNumber,
        ...invoice,
        createdAt: new Date().toISOString()
      };
      
      set(state => ({
        invoices: [...state.invoices, newInvoice],
        loading: false
      }));
    } catch (error) {
      console.error('Error adding invoice:', error);
      set({ error: 'Failed to add invoice', loading: false });
    }
  },
  
  updateInvoice: async (id: string, invoiceData: Partial<Invoice>) => {
    set({ loading: true, error: null });
    try {
      const invoiceRef = doc(db, 'invoices', id);
      
      // Convert date to Firestore timestamp if it exists
      const updateData = { ...invoiceData };
      if (updateData.date) {
        updateData.date = Timestamp.fromDate(new Date(updateData.date));
      }
      
      await updateDoc(invoiceRef, updateData);
      
      // Update the invoice in the local state
      set(state => ({
        invoices: state.invoices.map(invoice => 
          invoice.id === id ? { ...invoice, ...invoiceData } : invoice
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating invoice:', error);
      set({ error: 'Failed to update invoice', loading: false });
    }
  },
  
  updateInvoiceStatus: async (invoiceId: string, status: Invoice['status']) => {
    set({ loading: true, error: null });
    try {
      const invoiceRef = doc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, { status });
      
      // Update the invoice in the local state
      set(state => ({
        invoices: state.invoices.map(invoice => 
          invoice.id === invoiceId ? { ...invoice, status } : invoice
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating invoice status:', error);
      set({ error: 'Failed to update invoice status', loading: false });
    }
  },
  
  deleteInvoice: async (invoiceId: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
      
      // Remove the invoice from the local state
      set(state => ({
        invoices: state.invoices.filter(invoice => invoice.id !== invoiceId),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      set({ error: 'Failed to delete invoice', loading: false });
    }
  }
}));

// Initialize the super admin account
initializeSuperAdmin();