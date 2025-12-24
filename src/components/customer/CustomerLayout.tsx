import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Bell, User, LogOut, Smartphone } from 'lucide-react';
import { useThemeStore } from '../../lib/store';
import { useCustomerStore } from '../../lib/customerStore';
import { logoutUser } from '../../lib/firebase';

export default function CustomerLayout() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const {
    user,
    profile,
    notifications,
    unreadCount,
    reset,
    fetchProfile,
    fetchTickets,
    subscribeToTickets
  } = useCustomerStore();

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
              {/* Notifications Bell */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

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
