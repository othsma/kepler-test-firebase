import React from 'react';
import { useThemeStore } from '../lib/store';

export default function LoadingScreen() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
        <p className={`mt-4 text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Loading...
        </p>
      </div>
    </div>
  );
}