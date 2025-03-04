import React from 'react';
import { useThemeStore } from '../lib/store';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccessDenied() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className={`text-center p-8 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg max-w-md`}>
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-red-100">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <h1 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Access Denied
        </h1>
        
        <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}