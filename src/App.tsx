import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import Layout from './components/Layout';
import { useClientsStore, useTicketsStore, useProductsStore, useOrdersStore, useAuthStore } from './lib/store';
import { getUserRole, ROLES } from './lib/firebase';
import LoadingScreen from './components/LoadingScreen';
import AccessDenied from './components/AccessDenied';
import Pos from './pages/Pos'; // Not lazy for debugging

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const Tickets = lazy(() => import('./pages/SimpleTickets'));
const Products = lazy(() => import('./pages/Products'));
const Orders = lazy(() => import('./pages/Orders'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

function App() {
  const { 
    user, 
    userRole, 
    loading, 
    setUser, 
    setUserRole, 
    setLoading, 
    setInitialized 
  } = useAuthStore();
  
  const { fetchClients } = useClientsStore();
  const { fetchTickets, fetchSettings, fetchTechnicianTickets } = useTicketsStore();
  const { fetchProducts, fetchCategories } = useProductsStore();
  const { fetchOrders } = useOrdersStore();

  useEffect(() => {
    const auth = getAuth();
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      
      if (authUser) {
        setUser(authUser);
        
        // Get user role from Firestore
        const role = await getUserRole(authUser.uid);
        setUserRole(role);
        
        // Initialize data from Firebase based on role
        if (role === ROLES.SUPER_ADMIN) {
          // Super admin gets access to all data
          fetchClients();
          fetchTickets();
          fetchSettings();
          fetchProducts();
          fetchCategories();
          fetchOrders();
        } else {
          // Technicians only get their assigned tickets
          fetchSettings();
          if (authUser.uid) {
            fetchTechnicianTickets(authUser.uid);
          }
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      
      setLoading(false);
      setInitialized(true);
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Protected route component with role-based access
  interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string | null;
    allowedRoles?: string[] | null;
  }

  const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    requiredRole = null, 
    allowedRoles = null 
  }) => {
    if (loading) {
      return <LoadingScreen />;
    }
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    // Check if specific role is required
    if (requiredRole && userRole !== requiredRole) {
      return <AccessDenied />;
    }
    
    // Check if user's role is in the allowed roles list
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      return <AccessDenied />;
    }
    
    return <>{children}</>;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            
            {/* Super Admin Only Routes */}
            <Route path="clients" element={
              <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}>
                <Clients />
              </ProtectedRoute>
            } />
            
            {/* Both Super Admin and Technicians */}
            <Route path="tickets" element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TECHNICIAN]}>
                <Tickets />
              </ProtectedRoute>
            } />
            
            {/* Super Admin Only Routes */}
            <Route path="pos" element={
              <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}>
                <Pos />
              </ProtectedRoute>
            } />
            <Route path="pos/products" element={
              <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="pos/orders" element={
              <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}>
                <Orders />
              </ProtectedRoute>
            } />
            
            {/* Both Super Admin and Technicians */}
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Super Admin Only Routes */}
            <Route path="settings" element={
              <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="user-management" element={
              <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}>
                <UserManagement />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
