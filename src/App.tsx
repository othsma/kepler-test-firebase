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
import { getUserRole } from './lib/firebase';
import LoadingScreen from './components/LoadingScreen';

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
  const { fetchTickets, fetchSettings } = useTicketsStore();
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
        
        // Initialize data from Firebase
        fetchClients();
        fetchTickets();
        fetchSettings();
        fetchProducts();
        fetchCategories();
        fetchOrders();
        fetchInvoices();
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

  // Protected route component
  const ProtectedRoute = ({ children, requiredRole = null }) => {
    if (loading) {
      return <LoadingScreen />;
    }
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    if (requiredRole && userRole !== requiredRole) {
      return <Navigate to="/" />;
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
          <Route path="clients" element={<Clients />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="pos" element={<Pos />} />
          <Route path="pos/products" element={<Products />} />
          <Route path="pos/orders" element={<Orders />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="user-management" element={
            <ProtectedRoute requiredRole="superAdmin">
              <UserManagement />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;