import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Tickets from './pages/Tickets';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Pos from './pages/Pos';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import { useClientsStore, useTicketsStore, useProductsStore, useOrdersStore, useInvoicesStore, useAuthStore } from './lib/store';
import { getUserRole, ROLES } from './lib/firebase';
import LoadingScreen from './components/LoadingScreen';
import AccessDenied from './components/AccessDenied';

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
  const { fetchInvoices } = useInvoicesStore();

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
          fetchInvoices();
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
  const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = null }) => {
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
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <AccessDenied />;
    }
    
    return children;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;