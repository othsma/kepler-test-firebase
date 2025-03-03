import React from 'react';
import { Menu } from '@headlessui/react';
import { Sun, Moon, Globe, User, LogOut } from 'lucide-react';
import { useThemeStore, useUserStore, useAuthStore } from '../lib/store';
import { Link } from 'react-router-dom';
import { logoutUser } from '../lib/firebase';

export default function Header() {
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { language, setLanguage } = useUserStore();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logoutUser();
    logout();
  };

  return (
    <header className={`sticky top-0 z-40 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <div className="flex h-16 items-center justify-end gap-4 px-4 sm:px-6 lg:px-8">
        <button
          onClick={toggleDarkMode}
          className={`rounded-full p-2 ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <Menu as="div" className="relative">
          <Menu.Button className={`rounded-full p-2 ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}>
            <Globe className="h-5 w-5" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <Menu.Item>
              <button
                className={`block px-4 py-2 text-sm ${language === 'en' ? 'bg-gray-100' : ''}`}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
            </Menu.Item>
            <Menu.Item>
              <button
                className={`block px-4 py-2 text-sm ${language === 'es' ? 'bg-gray-100' : ''}`}
                onClick={() => setLanguage('es')}
              >
                Español
              </button>
            </Menu.Item>
            <Menu.Item>
              <button
                className={`block px-4 py-2 text-sm ${language === 'fr' ? 'bg-gray-100' : ''}`}
                onClick={() => setLanguage('fr')}
              >
                Français
              </button>
            </Menu.Item>
          </Menu.Items>
        </Menu>

        <Menu as="div" className="relative">
          <Menu.Button className={`rounded-full p-2 ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}>
            <User className="h-5 w-5" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <Menu.Item>
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Profile
              </Link>
            </Menu.Item>
            <Menu.Item>
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </Menu.Item>
          </Menu.Items>
        </Menu>
      </div>
    </header>
  );
}