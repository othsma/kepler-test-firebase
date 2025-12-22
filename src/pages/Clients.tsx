import React, { useState, useMemo, useEffect } from 'react';
import { useThemeStore, useClientsStore, useTicketsStore, useSalesStore } from '../lib/store';
import { Search, Plus, Edit2, Trash2, History, Calendar, User, Users, ChevronDown, ChevronRight, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function Clients() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { clients, addClient, updateClient, deleteClient, loading, error } = useClientsStore();
  const { tickets } = useTicketsStore();
  const { sales } = useSalesStore();
  const [activeTab, setActiveTab] = useState<'main' | 'all'>('all');
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [useLoadMore, setUseLoadMore] = useState(false);
  const [loadedItemsCount, setLoadedItemsCount] = useState(10);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

  // Pagination calculations
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

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

  // Get current page items with optimized memoization (pagination mode) or loaded items (load more mode)
  const displayedClients = useMemo(() => {
    if (useLoadMore) {
      return sortedAndFilteredClients.slice(0, loadedItemsCount);
    } else {
      return sortedAndFilteredClients.slice(startIndex, endIndex);
    }
  }, [sortedAndFilteredClients, startIndex, endIndex, useLoadMore, loadedItemsCount]);

  // Optimized pagination calculations
  const paginationInfo = useMemo(() => ({
    totalPages,
    startIndex,
    endIndex,
    totalItems: sortedAndFilteredClients.length
  }), [totalPages, startIndex, endIndex, sortedAndFilteredClients.length]);

  // Reset to page 1 when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [localSearchQuery]);

  // Reset to page 1 when sorting changes
  useMemo(() => {
    setCurrentPage(1);
  }, [sortField, sortDirection]);

  // Cached client history - prevent recalculation on every render
  const clientHistoryCache = useMemo(() => {
    const cache = new Map();
    return {
      get: (clientId: string) => {
        if (!cache.has(clientId)) {
          const clientTickets = tickets.filter(ticket => ticket.clientId === clientId);
          const clientSales = sales.filter(sale => sale.customer?.id === clientId);
          cache.set(clientId, { tickets: clientTickets, sales: clientSales });
        }
        return cache.get(clientId);
      }
    };
  }, [tickets, sales]);

  // Keyboard shortcuts for pagination
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Only handle shortcuts on the clients page
      if (activeTab !== 'all') return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (!useLoadMore && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (!useLoadMore && currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
          }
          break;
        case 'Home':
          event.preventDefault();
          if (!useLoadMore) {
            setCurrentPage(1);
          }
          break;
        case 'End':
          event.preventDefault();
          if (!useLoadMore) {
            setCurrentPage(totalPages);
          }
          break;
        default:
          // Number keys for direct page navigation
          const num = parseInt(event.key);
          if (!isNaN(num) && num >= 1 && num <= 9 && !useLoadMore) {
            event.preventDefault();
            if (num <= totalPages) {
              setCurrentPage(num);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, currentPage, totalPages, useLoadMore]);

  // URL state management
  useEffect(() => {
    // Update URL with current state
    const url = new URL(window.location.href);
    if (currentPage > 1) {
      url.searchParams.set('page', currentPage.toString());
    } else {
      url.searchParams.delete('page');
    }

    if (itemsPerPage !== 10) {
      url.searchParams.set('perPage', itemsPerPage.toString());
    } else {
      url.searchParams.delete('perPage');
    }

    if (localSearchQuery) {
      url.searchParams.set('search', localSearchQuery);
    } else {
      url.searchParams.delete('search');
    }

    if (sortField !== 'name') {
      url.searchParams.set('sort', sortField);
    } else {
      url.searchParams.delete('sort');
    }

    if (sortDirection !== 'asc') {
      url.searchParams.set('dir', sortDirection);
    } else {
      url.searchParams.delete('dir');
    }

    if (useLoadMore) {
      url.searchParams.set('mode', 'loadmore');
    } else {
      url.searchParams.delete('mode');
    }

    // Update URL without triggering navigation
    window.history.replaceState({}, '', url.toString());
  }, [currentPage, itemsPerPage, localSearchQuery, sortField, sortDirection, useLoadMore]);

  // Load state from URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);

    const page = parseInt(url.searchParams.get('page') || '1');
    if (page >= 1) setCurrentPage(page);

    const perPage = parseInt(url.searchParams.get('perPage') || '10');
    if ([10, 25, 50, 100].includes(perPage)) setItemsPerPage(perPage);

    const search = url.searchParams.get('search');
    if (search) setLocalSearchQuery(search);

    const sort = url.searchParams.get('sort');
    if (['name', 'email', 'createdAt'].includes(sort || '')) setSortField(sort as any);

    const dir = url.searchParams.get('dir');
    if (['asc', 'desc'].includes(dir || '')) setSortDirection(dir as any);

    const mode = url.searchParams.get('mode');
    if (mode === 'loadmore') setUseLoadMore(true);
  }, []); // Only run on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addClient(newClientData);
    setNewClientData({ name: '', email: '', phone: '', address: '' });
  };

  const getClientHistory = (clientId: string) => {
    const clientTickets = tickets.filter(ticket => ticket.clientId === clientId);
    const clientSales = sales.filter(sale => sale.customer?.id === clientId);
    return { tickets: clientTickets, sales: clientSales };
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

  // Export functionality
  const exportClients = (clientsToExport: any[], scope: 'current' | 'all' | 'selected', exportFormat: 'csv' | 'json') => {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = `clients_${scope}_${timestamp}.${exportFormat}`;

    if (exportFormat === 'csv') {
      // CSV Export
      const headers = ['Nom', 'Email', 'Téléphone', 'Adresse', 'Date d\'inscription'];
      const csvContent = [
        headers.join(','),
        ...clientsToExport.map(client => [
          `"${client.name}"`,
          `"${client.email || ''}"`,
          `"${client.phone}"`,
          `"${client.address || ''}"`,
          `"${format(new Date(client.createdAt), 'yyyy-MM-dd HH:mm:ss')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } else {
      // JSON Export
      const jsonContent = JSON.stringify(clientsToExport.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        createdAt: client.createdAt
      })), null, 2);

      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
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

          {/* Bulk Actions Toolbar */}
          {selectedClients.size > 0 && (
            <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-4 border-l-4 border-indigo-500`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isDarkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {selectedClients.size} client{selectedClients.size > 1 ? 's' : ''} sélectionné{selectedClients.size > 1 ? 's' : ''}
                  </div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Actions groupées:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const selectedClientsData = displayedClients.filter(client => selectedClients.has(client.id));
                      exportClients(selectedClientsData, 'selected', 'csv');
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Download className="h-4 w-4" />
                    Exporter CSV
                  </button>
                  <button
                    onClick={() => {
                      const selectedClientsData = displayedClients.filter(client => selectedClients.has(client.id));
                      exportClients(selectedClientsData, 'selected', 'json');
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Exporter JSON
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedClients.size} client${selectedClients.size > 1 ? 's' : ''} ?`)) {
                        for (const clientId of selectedClients) {
                          await deleteClient(clientId);
                        }
                        setSelectedClients(new Set());
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                  <button
                    onClick={() => setSelectedClients(new Set())}
                    className={`px-3 py-2 text-sm rounded-md border ${
                      isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Désélectionner
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search and Sort Controls */}
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-4`}>
            <div className="flex flex-col gap-4">
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

              {/* Bulk Selection Header */}
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={displayedClients.length > 0 && displayedClients.every(client => selectedClients.has(client.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Select all visible clients
                        const newSelection = new Set(selectedClients);
                        displayedClients.forEach(client => newSelection.add(client.id));
                        setSelectedClients(newSelection);
                      } else {
                        // Deselect all visible clients
                        const newSelection = new Set(selectedClients);
                        displayedClients.forEach(client => newSelection.delete(client.id));
                        setSelectedClients(newSelection);
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tout sélectionner
                  </span>
                  {selectedClients.size > 0 && (
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      ({selectedClients.size} sélectionné{selectedClients.size > 1 ? 's' : ''})
                    </span>
                  )}
                </div>

                {/* View Mode Toggle & Export */}
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Mode d'affichage:
                  </span>
                  <div className="flex rounded-md border border-gray-300">
                    <button
                      onClick={() => {
                        setUseLoadMore(false);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 text-sm rounded-l-md ${
                        !useLoadMore
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Pagination
                    </button>
                    <button
                      onClick={() => {
                        setUseLoadMore(true);
                        setLoadedItemsCount(10);
                      }}
                      className={`px-3 py-1 text-sm rounded-r-md ${
                        useLoadMore
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Charger plus
                    </button>
                  </div>

                  {/* Export Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border ${
                        isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Download className="h-4 w-4" />
                      Exporter
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {showExportDropdown && (
                      <>
                        {/* Click outside overlay */}
                        <div
                          className="fixed inset-0 z-5"
                          onClick={() => setShowExportDropdown(false)}
                        />
                        <div className={`absolute right-0 mt-2 w-56 rounded-md shadow-xl border ${
                          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        } z-10`}>
                          <div className="py-1">
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Exporter les données
                            </div>
                            <button
                              onClick={() => {
                                exportClients(displayedClients, 'current', 'csv');
                                setShowExportDropdown(false);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              📄 Page actuelle (CSV)
                            </button>
                            <button
                              onClick={() => {
                                exportClients(sortedAndFilteredClients, 'all', 'csv');
                                setShowExportDropdown(false);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              📊 Tous les clients (CSV)
                            </button>
                            <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                            <button
                              onClick={() => {
                                exportClients(displayedClients, 'current', 'json');
                                setShowExportDropdown(false);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              💾 Page actuelle (JSON)
                            </button>
                            <button
                              onClick={() => {
                                exportClients(sortedAndFilteredClients, 'all', 'json');
                                setShowExportDropdown(false);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              💽 Tous les clients (JSON)
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Load More Info */}
                  {useLoadMore && (
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Affichage de {displayedClients.length} sur {sortedAndFilteredClients.length} clients
                    </div>
                  )}
                </div>
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
              displayedClients.map((client) => {
          const { tickets: clientTickets, sales: clientSales } = getClientHistory(client.id);
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
                          <input
                            type="checkbox"
                            checked={selectedClients.has(client.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newSelection = new Set(selectedClients);
                              if (e.target.checked) {
                                newSelection.add(client.id);
                              } else {
                                newSelection.delete(client.id);
                              }
                              setSelectedClients(newSelection);
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
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
                        {clientSales.length > 0 ? (
                          clientSales.map((sale) => (
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
                          ))
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

          {/* Load More Button */}
          {useLoadMore && displayedClients.length < sortedAndFilteredClients.length && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => setLoadedItemsCount(prev => prev + 10)}
                className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Charger 10 clients supplémentaires
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {!useLoadMore && totalPages > 1 && (
            <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-4`}>
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Page Info */}
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center lg:text-left`}>
                  Affichage de {startIndex + 1}-{Math.min(endIndex, sortedAndFilteredClients.length)} sur {sortedAndFilteredClients.length} clients
                </div>

                {/* Items Per Page Selector & Go to Page */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Par page:
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1); // Reset to first page
                      }}
                      className={`rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                      }`}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Go to Page Input */}
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Aller à:
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = Number(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const page = Number((e.target as HTMLInputElement).value);
                          if (page >= 1 && page <= totalPages) {
                            setCurrentPage(page);
                          }
                        }
                      }}
                      className={`w-16 text-center rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                      }`}
                    />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      / {totalPages}
                    </span>
                  </div>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {/* First Page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-2 text-sm rounded-md border ${
                      currentPage === 1
                        ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="Première page"
                  >
                    ⟪
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 text-sm rounded-md border ${
                      currentPage === 1
                        ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Précédent
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm rounded-md border min-w-[40px] ${
                            currentPage === pageNum
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 text-sm rounded-md border ${
                      currentPage === totalPages
                        ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Suivant
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-2 text-sm rounded-md border ${
                      currentPage === totalPages
                        ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="Dernière page"
                  >
                    ⟫
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
}
