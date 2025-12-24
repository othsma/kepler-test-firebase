import React, { useState, useEffect } from 'react';
import { useThemeStore, useClientsStore } from '../lib/store';
import { generateCustomerCode } from '../lib/firebase';

interface ClientFormProps {
  onSubmit: (clientId: string) => void;
  onCancel: () => void;
}

export default function ClientForm({ onSubmit, onCancel }: ClientFormProps) {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { addClient, loading } = useClientsStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [customerCode, setCustomerCode] = useState('');

  // Generate customer code when component mounts
  useEffect(() => {
    setCustomerCode(generateCustomerCode());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add the new client with customer code
    const clientData = {
      ...formData,
      customerCode
    };

    const clientId = await addClient(clientData);

    if (clientId) {
      onSubmit(clientId);
    } else {
      console.error("Failed to create client");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>
      <div>
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Email (Optional)
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Phone
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>
      <div>
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Address (Optional)
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {/* Customer Code Display */}
      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-indigo-900 border border-indigo-700' : 'bg-indigo-50 border border-indigo-200'}`}>
        <div className="flex items-center">
          <div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-800' : 'bg-indigo-100'}`}>
            <svg className={`h-5 w-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className={`text-sm font-medium ${isDarkMode ? 'text-indigo-200' : 'text-indigo-800'}`}>
              Code d'accès client
            </h4>
            <p className={`text-lg font-mono font-bold ${isDarkMode ? 'text-indigo-100' : 'text-indigo-900'}`}>
              {customerCode}
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
              Donnez ce code au client pour qu'il puisse accéder à ses réparations
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Client'}
        </button>
      </div>
    </form>
  );
}
