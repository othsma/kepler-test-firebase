import React, { useState, useMemo } from 'react';
import { useThemeStore, useClientsStore, useTicketsStore, useOrdersStore, useSalesStore } from '../lib/store';
import { Search, Plus, Edit2, Trash2, History, Calendar, User, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function Clients() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { clients, addClient, updateClient, deleteClient, loading, error } = useClientsStore();
  const { tickets } = useTicketsStore();
  const { orders } = useOrdersStore();
  const { sales } = useSalesStore();
  const [activeTab, setActiveTab] = useState<'main' | 'all'>('main');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [editingInline, setEditingInline] = useState<string | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [inlineFormData, setInlineFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Local search state - completely independent of store
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'email' | 'createdAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedAndFilteredClients = useMemo(() => {
    let result = clients;

    // Apply search filter
    if (localSearchQuery.trim()) {
      const searchLower = localSearchQuery.toLowerCase();
      result = result.filter((client) => (
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone.toLowerCase().includes(searchLower) ||
        client.address.toLowerCase().includes(searchLower)
      ));
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return result;
  }, [clients, localSearchQuery, sortField, sortDirection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addClient(newClientData);
    setNewClientData({ name: '', email: '', phone: '', address: '' });
  };

  const getClientHistory = (clientId: string) => {
    const clientTickets = tickets.filter(ticket => ticket.clientId === clientId);
    const clientOrders = orders.filter(order => order.clientId === clientId);
    const clientSales = sales.filter(sale => sale.customer?.id === clientId);
    return { tickets: clientTickets, orders: clientOrders, sales: clientSales };
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      await deleteClient(id);
    }
  };

  const handleInlineEdit = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setEditingInline(clientId);
      setInlineFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
      });
    }
  };

  const handleInlineSubmit = async (e: React.FormEvent, clientId: string) => {
    e.preventDefault();
    await updateClient(clientId, inlineFormData);
    setEditingInline(null);
  };

  const handleInlineCancel = () => {
    setEditingInline(null);
    setInlineFormData({ name: '', email: '', phone: '', address: '' });
  };

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleSort = (field: 'name' | 'email' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Clients
      </h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'main'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="h-4 w-4" />
            Créer un client
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            Tous les clients ({clients.length})
          </button>
        </nav>
      </div>

      {/* Main Tab - Always visible form */}
      {activeTab === 'main' && (
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-indigo-600" />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Créer un nouveau client
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                  placeholder="Nom complet du client"
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Email
                </label>
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                  placeholder="email@exemple.com"
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                  placeholder="+33 6 XX XX XX XX"
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Adresse
                </label>
                <textarea
                  value={newClientData.address}
                  onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                  placeholder="Adresse complète"
                  rows={3}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => {
                  setNewClientData({ name: '', email: '', phone: '', address: '' });
                }}
                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Réinitialiser
              </button>
              <button
                type="submit"
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Créer le client
              </button>
            </div>
          </form>
        </div>
      )}

      {/* All Clients Tab */}
      {activeTab === 'all' && (
        <>
          {loading && (
            <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6 text-center`}>
              <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Chargement des clients...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {/* Search and Sort Controls */}
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-4`}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher des clients..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                  }`}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSort('name')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    sortField === 'name'
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Nom {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('email')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    sortField === 'email'
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('createdAt')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    sortField === 'createdAt'
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Date {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>

          {/* Clients List */}
          <div className="space-y-4">
            {sortedAndFilteredClients.length === 0 ? (
              <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-8 text-center`}>
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {localSearchQuery ? 'Aucun client trouvé' : 'Aucun client enregistré'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {localSearchQuery ? 'Essayez une recherche différente' : 'Commencez par créer votre premier client'}
                </p>
              </div>
            ) : (
              sortedAndFilteredClients.map((client) => {
          const { tickets: clientTickets, orders: clientOrders, sales: clientSales } = getClientHistory(client.id);
          const isSelected = selectedClient === client.id;
          const isExpanded = expandedClients.has(client.id);

          return (
            <div
              key={client.id}
              className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}
            >
              <div className="p-4">
                {editingInline === client.id ? (
                  <form onSubmit={(e) => handleInlineSubmit(e, client.id)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={inlineFormData.name}
                          onChange={(e) => setInlineFormData({ ...inlineFormData, name: e.target.value })}
                          className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Email
                        </label>
                        <input
                          type="email"
                          value={inlineFormData.email}
                          onChange={(e) => setInlineFormData({ ...inlineFormData, email: e.target.value })}
                          className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Téléphone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={inlineFormData.phone}
                          onChange={(e) => setInlineFormData({ ...inlineFormData, phone: e.target.value })}
                          className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Adresse
                        </label>
                        <textarea
                          value={inlineFormData.address}
                          onChange={(e) => setInlineFormData({ ...inlineFormData, address: e.target.value })}
                          rows={2}
                          className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                      >
                        Sauvegarder
                      </button>
                      <button
                        type="button"
                        onClick={handleInlineCancel}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Essential Info - Always Visible */}
                      <div
                      className={`flex justify-between items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors px-4 py-3 -mx-4 -my-3 rounded-lg ${
                        isExpanded ? 'bg-gray-50 dark:bg-gray-700/30' : ''
                      }`}
                      onClick={(e) => {
                        // Prevent expansion if clicking on action buttons
                        if ((e.target as Element).closest('button')) return;
                        toggleClientExpansion(client.id);
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-indigo-600" />
                          )}
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {client.name}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              📞 {client.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(isSelected ? null : client.id);
                          }}
                          className={`p-2 rounded-full ${
                            isSelected
                              ? 'bg-indigo-100 text-indigo-600'
                              : 'text-gray-400 hover:text-gray-500'
                          }`}
                          title="Historique"
                        >
                          <History className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInlineEdit(client.id);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-500"
                          title="Modifier"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Additional Details - Expandable */}
                    {isExpanded && (
                      <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Email
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {client.email || 'Non spécifié'}
                            </p>
                          </div>
                          <div>
                            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Adresse
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {client.address || 'Non spécifiée'}
                            </p>
                          </div>
                          <div>
                            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              ID Client
                            </p>
                            <p className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {client.id}
                            </p>
                          </div>
                          <div>
                            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Membre depuis
                            </p>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {format(new Date(client.createdAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {isSelected && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Historique du client
                    </h4>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h5 className={`text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Tickets de réparation
                      </h5>
                      <div className="space-y-2">
                        {clientTickets.length > 0 ? (
                          clientTickets.map((ticket) => (
                            <div
                              key={ticket.id}
                              className={`p-3 rounded-md ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex justify-between">
                                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                                  {ticket.deviceType} - {ticket.brand}
                                </span>
                                <span className={`text-sm ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  €{ticket.cost}
                                </span>
                              </div>
                              <p className={`text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                Tâches: {ticket.tasks.join(', ')}
                              </p>
                              {ticket.issue && (
                                <p className={`text-sm ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  Problème: {ticket.issue}
                                </p>
                              )}
                              <div className="flex justify-between items-center mt-2">
                                <span className={`text-sm ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  Statut: {ticket.status}
                                </span>
                                <span className={`text-sm ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Aucun ticket de réparation pour le moment
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className={`text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Historique d'achat
                      </h5>
                      <div className="space-y-2">
                        {clientOrders.length > 0 || clientSales.length > 0 ? (
                          <>
                            {/* Orders */}
                            {clientOrders.map((order) => (
                              <div
                                key={`order-${order.id}`}
                                className={`p-3 rounded-md ${
                                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                                }`}
                              >
                                <div className="flex justify-between">
                                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                                    Commande #{order.id}
                                  </span>
                                  <span className={`text-sm ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                  }`}>
                                    €{order.total}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <span className={`text-sm ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    Type: Commande • Statut: {order.status}
                                  </span>
                                  <span className={`text-sm ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {format(new Date(order.createdAt), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              </div>
                            ))}

                            {/* Sales/Invoices */}
                            {clientSales.map((sale) => (
                              <div
                                key={`sale-${sale.id}`}
                                className={`p-3 rounded-md ${
                                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                                }`}
                              >
                                <div className="flex justify-between">
                                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                                    Facture {sale.invoiceNumber}
                                  </span>
                                  <span className={`text-sm ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                  }`}>
                                    €{sale.total.toFixed(2)}
                                  </span>
                                </div>
                                <div className="mt-1">
                                  <p className={`text-sm ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {sale.items.length} article(s): {sale.items.slice(0, 2).map(item => item.name).join(', ')}
                                    {sale.items.length > 2 ? '...' : ''}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <span className={`text-sm ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    Type: Vente PDV • Paiement: {sale.paymentMethod}
                                  </span>
                                  <span className={`text-sm ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {format(new Date(sale.date), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Aucun historique d'achat pour le moment
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
          </div>
        </>
      )}
    </div>
  );
}
