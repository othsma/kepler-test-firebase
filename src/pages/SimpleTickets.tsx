import React, { useState, useEffect, useRef } from 'react';
import { useThemeStore, useTicketsStore, useClientsStore, useAuthStore, TaskWithPrice } from '../lib/store';
import { Search, Plus, Calendar, User, Edit, FileText as FileIcon, Trash2, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import ClientForm from '../components/ClientForm';
import UnifiedDocument from '../components/documents/UnifiedDocument';
import { convertTicketToDocument } from '../components/documents/DocumentConverter';
import { getAllTechnicians, ROLES } from '../lib/firebase';

export default function SimpleTickets() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { tickets, updateTicket, deleteTicket, loading, error, filterStatus, setFilterStatus } = useTicketsStore();
  const { clients } = useClientsStore();
  const { user, userRole } = useAuthStore();

  // Check if this is a fresh page load or component re-mount during session
  const isFreshLoad = useRef(!sessionStorage.getItem('ticketSessionActive'));
  if (isFreshLoad.current) {
    // Clear all form data on fresh page load
    sessionStorage.clear();
    sessionStorage.setItem('ticketSessionActive', 'true');
  }

  // State to track if user has started filling out the form
  const [hasStartedFillingForm, setHasStartedFillingForm] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('ticketFormStarted') || 'false');
    } catch {
      return false;
    }
  });

  // State for UI controls
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [editingTicket, setEditingTicket] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState(() => {
    if (!isFreshLoad.current) {
      try {
        return sessionStorage.getItem('ticketClientSearch') || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (!isFreshLoad.current) {
      try {
        return sessionStorage.getItem('ticketSelectedClientId') || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [showInvoice, setShowInvoice] = useState(false);
  const [newTicketNumber, setNewTicketNumber] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [technicians, setTechnicians] = useState<any[]>([]);

  // Dropdown open states
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Form state - controlled components with sessionStorage persistence
  const [deviceType, setDeviceType] = useState(() => {
    if (!isFreshLoad.current) {
      try {
        return sessionStorage.getItem('ticketDeviceType') || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [brand, setBrand] = useState(() => {
    if (!isFreshLoad.current) {
      try {
        return sessionStorage.getItem('ticketBrand') || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [model, setModel] = useState(() => {
    if (!isFreshLoad.current) {
      try {
        return sessionStorage.getItem('ticketModel') || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [tasksWithPrice, setTasksWithPrice] = useState<TaskWithPrice[]>(() => {
    if (!isFreshLoad.current) {
      try {
        const stored = sessionStorage.getItem('ticketTasksWithPrice');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [issue, setIssue] = useState(() => {
    if (!isFreshLoad.current) {
      try {
        return sessionStorage.getItem('ticketIssue') || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [passcode, setPasscode] = useState(() => {
    if (!isFreshLoad.current) {
      try {
        return sessionStorage.getItem('ticketPasscode') || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'completed'>(() => {
    if (!isFreshLoad.current) {
      try {
        return (sessionStorage.getItem('ticketStatus') as 'pending' | 'in-progress' | 'completed') || 'pending';
      } catch {
        return 'pending';
      }
    }
    return 'pending';
  });
  const [technicianId, setTechnicianId] = useState(() => {
    if (!isFreshLoad.current) {
      try {
        return sessionStorage.getItem('ticketTechnicianId') || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [paymentStatus, setPaymentStatus] = useState<'not_paid' | 'partially_paid' | 'fully_paid'>(() => {
    if (!isFreshLoad.current) {
      try {
        return (sessionStorage.getItem('ticketPaymentStatus') as 'not_paid' | 'partially_paid' | 'fully_paid') || 'not_paid';
      } catch {
        return 'not_paid';
      }
    }
    return 'not_paid';
  });
  const [amountPaid, setAmountPaid] = useState(() => {
    if (!isFreshLoad.current) {
      try {
        return parseFloat(sessionStorage.getItem('ticketAmountPaid') || '0');
      } catch {
        return 0;
      }
    }
    return 0;
  });
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPrice, setNewTaskPrice] = useState(0);

  // Add new state variables for sorting and filtering
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchField, setSearchField] = useState<'all' | 'tasks' | 'client' | 'ticket'>('all');

  // Tab navigation state
  const [currentView, setCurrentView] = useState<'create' | 'all'>('all');

  // Fetch technicians for super admin
  useEffect(() => {
    const fetchTechnicianData = async () => {
      try {
        if (userRole === ROLES.SUPER_ADMIN) {
          const techList = await getAllTechnicians();
          setTechnicians(techList || []);
        }
      } catch (error) {
        console.error("Error fetching technicians:", error);
      }
    };
    
    fetchTechnicianData();
  }, [userRole]);

  // Populate form when editing ticket changes
  useEffect(() => {
    if (editingTicket) {
      const ticket = tickets.find(t => t.id === editingTicket);
      if (ticket) {
        setDeviceType(ticket.deviceType || '');
        setBrand(ticket.brand || '');
        setModel(ticket.model || '');
        setIssue(ticket.issue || '');
        setPasscode(ticket.passcode || '');
        setAmountPaid(ticket.amountPaid || 0);

        setTasksWithPrice(ticket.taskPrices ||
          ticket.tasks.map(task => ({
            name: task,
            price: ticket.cost / (ticket.tasks.length || 1)
          }))
        );
        setStatus(ticket.status || 'pending');
        setTechnicianId(ticket.technicianId || '');
        setPaymentStatus(ticket.paymentStatus || 'not_paid');
      }
    }
  }, [editingTicket]);

  // Save form state to sessionStorage when it changes
  useEffect(() => {
    try {
      sessionStorage.setItem('ticketFormStarted', JSON.stringify(hasStartedFillingForm));
      sessionStorage.setItem('ticketClientSearch', clientSearch);
      sessionStorage.setItem('ticketSelectedClientId', selectedClientId);
      sessionStorage.setItem('ticketDeviceType', deviceType);
      sessionStorage.setItem('ticketBrand', brand);
      sessionStorage.setItem('ticketModel', model);
      sessionStorage.setItem('ticketTasksWithPrice', JSON.stringify(tasksWithPrice));
      sessionStorage.setItem('ticketIssue', issue);
      sessionStorage.setItem('ticketPasscode', passcode);
      sessionStorage.setItem('ticketStatus', status);
      sessionStorage.setItem('ticketTechnicianId', technicianId);
      sessionStorage.setItem('ticketPaymentStatus', paymentStatus);
      sessionStorage.setItem('ticketAmountPaid', amountPaid.toString());
    } catch (error) {
      console.error('Error saving form state to sessionStorage:', error);
    }
  }, [hasStartedFillingForm, clientSearch, selectedClientId, deviceType, brand, model, tasksWithPrice, issue, passcode, status, technicianId, paymentStatus, amountPaid]);

  // Filter tickets based on search and status
  const filteredTickets = tickets.filter(ticket => {
    // Filter by role
    if (userRole === ROLES.TECHNICIAN && user && ticket.technicianId !== user.uid) {
      return false;
    }
    
    // Filter by status
    if (filterStatus !== 'all' && ticket.status !== filterStatus) {
      return false;
    }
    
    // Filter by search
    if (searchQuery) {
      const client = clients.find(c => c.id === ticket.clientId);
      const searchLower = searchQuery.toLowerCase();
      
      switch (searchField) {
        case 'tasks':
          return ticket.tasks.some(task => 
            task.toLowerCase().includes(searchLower)
          );
        case 'client':
          return (
            client?.name?.toLowerCase().includes(searchLower) ||
            client?.email?.toLowerCase().includes(searchLower) ||
            client?.phone?.toLowerCase().includes(searchLower)
          );
        case 'ticket':
          return ticket.ticketNumber?.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            ticket.ticketNumber?.toLowerCase().includes(searchLower) ||
            ticket.deviceType?.toLowerCase().includes(searchLower) ||
            ticket.brand?.toLowerCase().includes(searchLower) ||
            client?.name?.toLowerCase().includes(searchLower) ||
            client?.email?.toLowerCase().includes(searchLower) ||
            client?.phone?.toLowerCase().includes(searchLower) ||
            ticket.tasks.some(task => task.toLowerCase().includes(searchLower))
          );
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by date
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Filter clients based on search
  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Calculate total cost (VAT-inclusive pricing - task prices already include VAT)
  const totalCost = tasksWithPrice.reduce((sum, task) => sum + (task.price || 0), 0);
  const vatAmount = totalCost * (0.2 / 1.2); // Extract VAT from inclusive total
  const subtotal = totalCost - vatAmount; // Net amount (excluding VAT)

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!selectedClientId && !editingTicket) {
        alert('Please select a client');
        return;
      }
      
      const tasks = tasksWithPrice.map(t => t.name);
      
      // Ensure clientId is a string
      const clientId = editingTicket 
        ? tickets.find(t => t.id === editingTicket)?.clientId || ''
        : selectedClientId;
        
      if (!clientId) {
        alert('Client ID is required');
        return;
      }
      
      // Read values from state variables
      const ticketData = {
        deviceType,
        brand,
        model,
        tasks,
        taskPrices: tasksWithPrice,
        issue,
        passcode,
        status,
        cost: totalCost,
        technicianId: technicianId || '',
        clientId,
        paymentStatus,
        amountPaid
      };
      
      if (editingTicket) {
        await updateTicket(editingTicket, ticketData);
        setEditingTicket(null);
      } else {
        const { addTicket } = useTicketsStore.getState();
        const newTicketNumber = await addTicket(ticketData);
        setNewTicketNumber(newTicketNumber);
        setShowInvoice(true);
      }
      
      // Only reset form if not editing
      if (!editingTicket) {
        setIsAddingTicket(false);
        setClientSearch('');
        setSelectedClientId('');

        // Reset form fields
        setDeviceType('');
        setBrand('');
        setModel('');
        setTasksWithPrice([]);
        setIssue('');
        setPasscode('');
        setStatus('pending');
        setTechnicianId('');
        setPaymentStatus('not_paid');
        setAmountPaid(0);

        // Reset the form tracking state
        setHasStartedFillingForm(false);
      }
      
      // Reset form fields for new tickets
      if (!editingTicket) {
        setPaymentStatus('not_paid');
        setAmountPaid(0);
      }
      
    } catch (error) {
      console.error("Error submitting ticket:", error);
      alert("An error occurred while saving the ticket. Please try again.");
    }
  };

  // Handle adding a new task
  const handleAddTask = (taskName: string) => {
    if (taskName.trim()) {
      setTasksWithPrice([...tasksWithPrice, { name: taskName.trim(), price: 0 }]);
    }
  };

  // Handle removing a task
  const handleRemoveTask = (taskName: string) => {
    setTasksWithPrice(tasksWithPrice.filter(t => t.name !== taskName));
  };

  // Handle updating task price
  const handleUpdateTaskPrice = (taskName: string, price: number) => {
    setTasksWithPrice(tasksWithPrice.map(t => 
      t.name === taskName ? { ...t, price } : t
    ));
  };

  // Handle new client creation
  const handleNewClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClientId(clientId);
      setClientSearch(client.name);
    }
    setIsAddingClient(false);
  };

  // Handle ticket deletion
  const handleDeleteTicket = async (ticketId: string) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await deleteTicket(ticketId);
      } catch (error) {
        console.error("Error deleting ticket:", error);
        alert("An error occurred while deleting the ticket.");
      }
    }
  };

  // Fixed brand selection handler
  const handleBrandSelect = (selectedBrand: string) => {
    setBrand(selectedBrand);
    setModel('');
    setDeviceType('');
  };

  // Get technician name by ID
  const getTechnicianName = (techId: string) => {
    const tech = technicians.find((t: any) => t.id === techId);
    return tech ? tech.fullName : 'Unassigned';
  };

  // Fixed device type addition handler
  const handleAddDeviceType = async (value: string) => {
    const { addDeviceType } = useTicketsStore.getState();
    await addDeviceType(value);
    // Keep selection visible - already set in the input
  };

  // Check if user can edit a ticket
  const canEditTicket = (ticket: any) => {
    if (userRole === ROLES.SUPER_ADMIN) return true;
    if (userRole === ROLES.TECHNICIAN && user && ticket.technicianId === user?.uid) return true;
    return false;
  };

  // Fixed brand addition handler
  const handleAddBrand = async (value: string) => {
    const { addBrand } = useTicketsStore.getState();
    await addBrand(value);
    // Keep selection visible - already set in the input
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">En attente</span>;
      case 'in-progress':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">En cours</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Terminé</span>;
      default:
        return null;
    }
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'not_paid':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Non payé</span>;
      case 'partially_paid':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Partiellement payé</span>;
      case 'fully_paid':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Payé</span>;
      default:
        return null;
    }
  };

  // Fixed model addition handler
  const handleAddModel = async (value: string, brand: string) => {
    const { addModel } = useTicketsStore.getState();
    await addModel({ name: value, brandId: brand });
    // Keep selection visible - already set in the input
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {userRole === ROLES.TECHNICIAN ? 'Mes tickets assignés' : 'Tickets de réparation'}
        </h1>
        {/* Form is always visible in Create Ticket tab */}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setCurrentView('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'create'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Créer un ticket
          </button>
          <button
            onClick={() => setCurrentView('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tous les tickets
          </button>
        </nav>
      </div>

      {loading && (
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6 text-center`}>
          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Chargement des tickets...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Create Ticket Tab Content */}
      {currentView === 'create' && (
        <>
          {/* Create/Edit Ticket Form - Always visible in Create Ticket tab */}
          {userRole === ROLES.SUPER_ADMIN && (
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {editingTicket ? 'Modifier le ticket' : 'Créer un nouveau ticket'}
          </h2>
          
          {/* Client Selection (only for new tickets) */}
          {!editingTicket && !isAddingClient && (
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Client
              </label>
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setSelectedClientId('');
                      // Only show dropdown if there's input
                      setShowClientDropdown(e.target.value.length > 0);
                    }}
                    onBlur={() => {
                      // Delay hiding dropdown to allow for clicks
                      setTimeout(() => setShowClientDropdown(false), 200);
                    }}
                    placeholder="Commencez à taper pour rechercher un client..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingClient(true)}
                    className="mt-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Nouveau client
                  </button>
                </div>
                {showClientDropdown && clientSearch && !selectedClientId && !isAddingClient && filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 ring-1 ring-black ring-opacity-5">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setClientSearch(client.name);
                          setShowClientDropdown(false);
                        }}
                      >
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Client Form */}
          {isAddingClient ? (
            <ClientForm
              onSubmit={handleNewClient}
              onCancel={() => setIsAddingClient(false)}
            />
          ) : (
            /* Ticket Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Device Type */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Type d'appareil
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={deviceType}
                    onChange={(e) => {
                      setHasStartedFillingForm(true);
                      setDeviceType(e.target.value);
                      // Only show dropdown if there's input
                      setShowDeviceDropdown(e.target.value.length > 0);
                    }}
                    onBlur={() => {
                      // Delay hiding dropdown to allow for clicks
                      setTimeout(() => setShowDeviceDropdown(false), 200);
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Commencez à taper pour rechercher un type d'appareil"
                    required
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission
                        return false;
                      }
                    }}
                  />
                  {showDeviceDropdown && deviceType && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 ring-1 ring-black ring-opacity-5">
                      {useTicketsStore.getState().settings.deviceTypes
                        .filter(type => type.toLowerCase().includes(deviceType.toLowerCase()))
                        .map((type) => (
                          <div
                            key={type}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                            onClick={() => {
                              setDeviceType(type);
                              setShowDeviceDropdown(false);
                            }}
                          >
                            {type}
                          </div>
                        ))}
                      {deviceType && !useTicketsStore.getState().settings.deviceTypes.some(
                        type => type.toLowerCase() === deviceType.toLowerCase()
                      ) && (
                          <div
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-indigo-600"
                            onClick={async () => {
                              await handleAddDeviceType(deviceType);
                              setShowDeviceDropdown(false);
                            }}
                          >
                          Add "{deviceType}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Brand */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Marque
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => {
                      setHasStartedFillingForm(true);
                      setBrand(e.target.value);
                      // Only show dropdown if there's input
                      setShowBrandDropdown(e.target.value.length > 0);
                      if (!e.target.value) {
                        setModel(''); // Clear model when brand is cleared
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding dropdown to allow for clicks
                      setTimeout(() => setShowBrandDropdown(false), 200);
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Commencez à taper pour rechercher une marque"
                    required
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission
                        return false;
                      }
                    }}
                  />
                  {showBrandDropdown && brand && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 ring-1 ring-black ring-opacity-5">
                      {useTicketsStore.getState().settings.brands
                        .filter(b => b.toLowerCase().includes(brand.toLowerCase()))
                        .map((b) => (
                          <div
                            key={b}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                            onClick={() => {
                              // Clear model when changing brand
                              setBrand(b);
                              setModel('');
                              setShowBrandDropdown(false);
                            }}
                          >
                            {b}
                          </div>
                        ))}
                      {brand && !useTicketsStore.getState().settings.brands.some(
                        b => b.toLowerCase() === brand.toLowerCase()
                      ) && (
                          <div
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-indigo-600"
                            onClick={async () => {
                              // Add to global settings in the background
                              const { addBrand } = useTicketsStore.getState();
                              try {
                                await addBrand(brand);
                                setModel(''); // Clear dependent field
                              } catch (error) {
                                console.error("Error adding brand:", error);
                              }
                              setShowBrandDropdown(false);
                            }}
                          >
                          Add "{brand}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Model */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Modèle
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => {
                      setHasStartedFillingForm(true);
                      setModel(e.target.value);
                      // Only show dropdown if there's input
                      setShowModelDropdown(e.target.value.length > 0);
                    }}
                    onBlur={() => {
                      // Delay hiding dropdown to allow for clicks
                      setTimeout(() => setShowModelDropdown(false), 200);
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Commencez à taper pour rechercher un modèle"
                    required
                    disabled={!brand}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission
                        return false;
                      }
                    }}
                  />
                  {showModelDropdown && brand && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 ring-1 ring-black ring-opacity-5">
                      {useTicketsStore.getState().settings.models
                        .filter(m => m.brandId === brand && m.name.toLowerCase().includes(model.toLowerCase()))
                        .map((m) => (
                          <div
                            key={m.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                            onClick={() => {
                              setModel(m.name);
                              setShowModelDropdown(false);
                            }}
                          >
                            {m.name}
                          </div>
                        ))}
                      {model && !useTicketsStore.getState().settings.models.some(
                        m => m.brandId === brand && m.name.toLowerCase() === model.toLowerCase()
                      ) && (
                          <div
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-indigo-600"
                            onClick={async () => {
                              await handleAddModel(model, brand);
                              setShowModelDropdown(false);
                            }}
                          >
                          Add "{model}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Technician Assignment - Only visible to super admin */}
              {userRole === ROLES.SUPER_ADMIN && (
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Assigner à un technicien
                  </label>
                  <select
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Non assigné</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tasks */}
              <div>
                <div className="flex justify-between items-center">
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tâches
                  </label>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Coût total: €{totalCost.toFixed(2)}
                  </div>
                </div>
                
                {/* Task search */}
                <div className="relative">
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => {
                      setNewTaskName(e.target.value);
                      // Only show dropdown if there's input
                      setShowTaskDropdown(e.target.value.length > 0);
                    }}
                    onBlur={() => {
                      // Delay hiding dropdown to allow for clicks
                      setTimeout(() => setShowTaskDropdown(false), 200);
                    }}
                    placeholder="Commencez à taper pour rechercher une tâche"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission
                        return false;
                      }
                    }}
                  />
                  {showTaskDropdown && newTaskName && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 ring-1 ring-black ring-opacity-5">
                      {useTicketsStore.getState().settings.tasks
                        .filter(task => task.toLowerCase().includes(newTaskName.toLowerCase()))
                        .slice(0, 5)
                        .map((task) => (
                          <div
                            key={task}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                            onClick={() => {
                              handleAddTask(task);
                              setNewTaskName('');
                              setShowTaskDropdown(false);
                            }}
                          >
                            {task}
                          </div>
                        ))}
                      {newTaskName && !useTicketsStore.getState().settings.tasks.some(
                        task => task.toLowerCase() === newTaskName.toLowerCase()
                      ) && (
                        <div className="flex flex-col">
                          <div
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-indigo-600"
                            onClick={async () => {
                              const taskName = newTaskName;
                              const taskPrice = newTaskPrice;

                              // Add to tasks with price for current ticket - update sessionStorage directly
                              const newTasks = [...tasksWithPrice, { name: taskName, price: taskPrice }];
                              sessionStorage.setItem('ticketTasksWithPrice', JSON.stringify(newTasks));
                              setTasksWithPrice(newTasks);
                              setHasStartedFillingForm(true);

                              // Add to global settings in the background
                              const { addTask } = useTicketsStore.getState();
                              try {
                                await addTask(taskName);
                              } catch (error) {
                                console.error("Error adding task:", error);
                              }

                              // Clear the inputs to close the dropdown
                              setNewTaskName('');
                              setNewTaskPrice(0);
                              setShowTaskDropdown(false);
                            }}
                          >
                          Add "{newTaskName}"
                        </div>
                          <div className="px-4 py-2 flex items-center">
                            <span className="mr-2">Price:</span>
                            <div className="flex items-center">
                              <span className="mr-1">€</span>
                              <input
                                type="number"
                                value={newTaskPrice}
                                onChange={(e) => setNewTaskPrice(Number(e.target.value))}
                                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Popular tasks */}
                <div className="mt-4">
                  <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tâches populaires
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from(
                      useTicketsStore.getState().tickets
                        .flatMap(ticket => ticket.tasks)
                        .reduce((counts: Map<string, number>, task: string) => {
                          counts.set(task, (counts.get(task) || 0) + 1);
                          return counts;
                        }, new Map<string, number>())
                        .entries()
                    )
                      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([task]: [string, number]) => (
                        <label key={task} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={tasksWithPrice.some(t => t.name === task)}
                    onChange={() => {
                      setHasStartedFillingForm(true);
                      const exists = tasksWithPrice.some(t => t.name === task);
                      if (exists) {
                        setTasksWithPrice(prev => prev.filter(t => t.name !== task));
                      } else {
                        handleAddTask(task);
                      }
                    }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {task}
                          </span>
                        </label>
                      ))
                    }
                  </div>
                </div>
                
                {/* Selected tasks */}
                {tasksWithPrice.length > 0 && (
                  <div className="mt-4">
                    <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tâches sélectionnées
                    </h4>
                    <div className="space-y-2 border rounded-md p-3">
                      {tasksWithPrice.map((task) => (
                        <div key={task.name} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <button
                              type="button"

                              onClick={() => handleRemoveTask(task.name)}
                              className="mr-2 text-red-500 hover:text-red-700"
                            >
                              Supprimer
                            </button>
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {task.name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1">€</span>
                            <input
                              type="number"
                              value={task.price}
                              onChange={(e) => handleUpdateTaskPrice(task.name, Number(e.target.value))}
                              className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Passcode */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Code de déverrouillage (optionnel)
                </label>
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Issue Description */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description du problème (optionnel)
                </label>
                <textarea
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Status - Only for editing */}
              {editingTicket && (
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Statut
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'pending' | 'in-progress' | 'completed')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="pending">En attente</option>
                    <option value="in-progress">En cours</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>
              )}

              {/* Payment Status */}
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Statut du paiement
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as 'not_paid' | 'partially_paid' | 'fully_paid')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="not_paid">Non payé</option>
                  <option value="partially_paid">Partiellement payé</option>
                  <option value="fully_paid">Payé</option>
                </select>
              </div>

              {/* Amount Paid - Only show for partially paid tickets */}
              {paymentStatus === 'partially_paid' && (
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Montant payé (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTicket(false);
                    setEditingTicket(null);
                    setClientSearch('');
                    setSelectedClientId('');

                    // Reset all form fields
                    setDeviceType('');
                    setBrand('');
                    setModel('');
                    setTasksWithPrice([]);
                    setIssue('');
                    setPasscode('');
                    setStatus('pending');
                    setTechnicianId('');
                    setPaymentStatus('not_paid');
                    setAmountPaid(0);

                    // Reset the form tracking state
                    setHasStartedFillingForm(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (editingTicket ? 'Mise à jour...' : 'Création...') : (editingTicket ? 'Mettre à jour le ticket' : 'Créer le ticket')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      </>
      )}

      {/* All Tickets Tab Content */}
      {currentView === 'all' && (
        <>
          {/* Tickets Table */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search and Filters */}
          <div className="flex-1 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
            {/* Search Field Selector */}
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as any)}
              className="w-full sm:w-40 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">Tout rechercher</option>
              <option value="ticket">Numéro de ticket</option>
              <option value="client">Informations client</option>
              <option value="tasks">Tâches</option>
            </select>

            {/* Search Input */}
            <div className="flex-1 flex items-center gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Rechercher des ${searchField === 'all' ? 'tickets' : searchField}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          {/* Status and Date Sort */}
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in-progress">En cours</option>
              <option value="completed">Terminé</option>
            </select>

            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Trier par date"
            >
              <Calendar className="h-4 w-4" />
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">{sortDirection === 'asc' ? 'Plus ancien d\'abord' : 'Plus récent d\'abord'}</span>
            </button>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ticket #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Appareil
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tâches
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Coût
                </th>
                {userRole === ROLES.SUPER_ADMIN && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Technicien
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px] w-[180px] sm:w-[160px] md:w-[180px]">
                  Paiement
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => {
                  const client = clients.find((c) => c.id === ticket.clientId);
                  
                  // Display task prices if available
                  const taskPriceDisplay = ticket.taskPrices ?
                    ticket.taskPrices.map(tp => `${tp.name} (€${tp.price})`).join(', ') :
                    ticket.tasks.join(', ');
                  
                  return (
                    <tr key={ticket.id} className={`hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{ticket.ticketNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {client?.name || 'Unknown Client'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {ticket.deviceType} - {ticket.brand}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                        {taskPriceDisplay}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        €{ticket.cost}
                      </td>
                      {userRole === ROLES.SUPER_ADMIN && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {ticket.technicianId ? getTechnicianName(ticket.technicianId) : 'Unassigned'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Only allow status updates for assigned technician or super admin */}
                        {canEditTicket(ticket) ? (
                          <select
                            value={ticket.status}
                            onChange={(e) =>
                              updateTicket(ticket.id, {
                                status: e.target.value as 'pending' | 'in-progress' | 'completed',
                              })
                            }
                            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="pending">En attente</option>
                            <option value="in-progress">En cours</option>
                            <option value="completed">Terminé</option>
                          </select>
                        ) : (
                          getStatusBadge(ticket.status)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentStatusBadge(ticket.paymentStatus || 'not_paid')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM d, yyyy') : 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-3">
                          {/* Edit button - only for assigned technician or super admin */}
                          {canEditTicket(ticket) && (
                            <button
                              onClick={() => {
                                setEditingTicket(ticket.id);
                                setCurrentView('create'); // Switch to create tab for editing
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                          )}
                          
                          {/* Document button - handles both thermal and A4 formats */}
                          <button
                            onClick={() => {
                              setNewTicketNumber(ticket.ticketNumber);
                              setSelectedClientId(ticket.clientId);
                              setShowInvoice(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Generate Document"
                          >
                            <FileIcon className="h-5 w-5" />
                          </button>
                          
                          {/* Delete button - only for super admin */}
                          {userRole === ROLES.SUPER_ADMIN && (
                            <button
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={userRole === ROLES.SUPER_ADMIN ? 9 : 8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {userRole === ROLES.TECHNICIAN ? 'No tickets assigned to you yet' : 'No tickets found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Document Modal - handles both thermal and A4 formats */}
      {showInvoice && newTicketNumber && (
        <UnifiedDocument
          data={convertTicketToDocument(
            tickets.find(t => t.ticketNumber === newTicketNumber)!,
            selectedClientId,
            clients.find(c => c.id === selectedClientId)
          )}
          onClose={() => setShowInvoice(false)}
          initialFormat="a4"
        />
      )}
    </div>
  );
}
