import React, { useState, useEffect } from 'react';
import { useThemeStore, useTicketsStore, useClientsStore, useAuthStore, TaskWithPrice } from '../lib/store';
import { Search, Plus, Calendar, User, Edit, Printer, FileText as FileIcon, Trash2 } from 'lucide-react';
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
  
  // State for UI controls
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [editingTicket, setEditingTicket] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [newTicketNumber, setNewTicketNumber] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [technicians, setTechnicians] = useState<any[]>([]);
  
  // Form state
  const [deviceType, setDeviceType] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [tasksWithPrice, setTasksWithPrice] = useState<TaskWithPrice[]>([]);
  const [issue, setIssue] = useState('');
  const [passcode, setPasscode] = useState('');
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending');
  const [technicianId, setTechnicianId] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPrice, setNewTaskPrice] = useState(0);

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

  // Reset form when editing ticket changes
  useEffect(() => {
    if (editingTicket) {
      const ticket = tickets.find(t => t.id === editingTicket);
      if (ticket) {
        setDeviceType(ticket.deviceType || '');
        setBrand(ticket.brand || '');
        setModel(ticket.model || '');
        setTasksWithPrice(ticket.taskPrices || 
          ticket.tasks.map(task => ({
            name: task,
            price: ticket.cost / (ticket.tasks.length || 1)
          }))
        );
        setIssue(ticket.issue || '');
        setPasscode(ticket.passcode || '');
        setStatus(ticket.status || 'pending');
        setTechnicianId(ticket.technicianId || '');
      }
    } else {
      // Reset form for new ticket
      setDeviceType('');
      setBrand('');
      setModel('');
      setTasksWithPrice([]);
      setIssue('');
      setPasscode('');
      setStatus('pending');
      setTechnicianId(userRole === ROLES.TECHNICIAN && user ? user.uid : '');
    }
  }, [editingTicket, tickets, userRole, user]);

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
      
      return (
        ticket.ticketNumber?.toLowerCase().includes(searchLower) ||
        ticket.deviceType?.toLowerCase().includes(searchLower) ||
        ticket.brand?.toLowerCase().includes(searchLower) ||
        client?.name?.toLowerCase().includes(searchLower) ||
        false
      );
    }
    
    return true;
  });

  // Filter clients based on search
  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Calculate total cost
  const totalCost = tasksWithPrice.reduce((sum, task) => sum + (task.price || 0), 0);

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
        clientId
      };
      
      if (editingTicket) {
        await updateTicket(editingTicket, ticketData);
        setEditingTicket(null);
      } else {
        const { addTicket } = useTicketsStore.getState();
        const newTicketNumber = await addTicket(ticketData);
        setNewTicketNumber(newTicketNumber);
        setShowReceipt(true);
      }
      
      // Reset form
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
      
    } catch (error) {
      console.error("Error submitting ticket:", error);
      alert("An error occurred while saving the ticket. Please try again.");
    }
  };

  // Handle adding a new task
  const handleAddTask = () => {
    if (newTaskName.trim()) {
      setTasksWithPrice([...tasksWithPrice, { name: newTaskName.trim(), price: newTaskPrice }]);
      setNewTaskName('');
      setNewTaskPrice(0);
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

  // Get technician name by ID
  const getTechnicianName = (techId: string) => {
    const tech = technicians.find(t => t.id === techId);
    return tech ? tech.fullName : 'Unassigned';
  };

  // Check if user can edit a ticket
  const canEditTicket = (ticket: any) => {
    if (userRole === ROLES.SUPER_ADMIN) return true;
    if (userRole === ROLES.TECHNICIAN && user && ticket.technicianId === user.uid) return true;
    return false;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'in-progress':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {userRole === ROLES.TECHNICIAN ? 'My Assigned Tickets' : 'Repair Tickets'}
        </h1>
        {userRole === ROLES.SUPER_ADMIN && (
          <button
            onClick={() => setIsAddingTicket(!isAddingTicket)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {isAddingTicket ? 'Hide Form' : 'New Ticket'}
          </button>
        )}
      </div>

      {loading && (
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6 text-center`}>
          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading tickets...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Create/Edit Ticket Form */}
      {(isAddingTicket || editingTicket) && userRole === ROLES.SUPER_ADMIN && (
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {editingTicket ? 'Edit Ticket' : 'Create New Ticket'}
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
                    }}
                    placeholder="Search for a client..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingClient(true)}
                    className="mt-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    New Client
                  </button>
                </div>
                {clientSearch && !selectedClientId && !isAddingClient && filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setClientSearch(client.name);
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
                  Device Type
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Search or add new device type"
                    required
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission
                        return false;
                      }
                    }}
                  />
                  {deviceType && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
                      {useTicketsStore.getState().settings.deviceTypes
                        .filter(type => type.toLowerCase().includes(deviceType.toLowerCase()))
                        .map((type) => (
                          <div
                            key={type}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setDeviceType(type);
                              // Clear the search to close the dropdown
                              setDeviceType('');
                              setTimeout(() => setDeviceType(type), 10);
                            }}
                          >
                            {type}
                          </div>
                        ))}
                      {!useTicketsStore.getState().settings.deviceTypes.some(
                        type => type.toLowerCase() === deviceType.toLowerCase()
                      ) && (
                          <div
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-indigo-600"
                            onClick={async () => {
                              // Add to global settings in the background
                              const { addDeviceType } = useTicketsStore.getState();
                              const currentValue = deviceType;
                              
                              try {
                                // Add to settings without clearing the form
                                await addDeviceType(currentValue);
                              } catch (error) {
                                console.error("Error adding device type:", error);
                              }
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
                  Brand
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value);
                      if (!e.target.value) {
                        setModel(''); // Clear model when brand is cleared
                      }
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Search or add new brand"
                    required
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission
                        return false;
                      }
                    }}
                  />
                  {brand && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
                      {useTicketsStore.getState().settings.brands
                        .filter(b => b.toLowerCase().includes(brand.toLowerCase()))
                        .map((b) => (
                          <div
                            key={b}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              // Clear model when changing brand
                              setModel('');
                              
                              // Clear the search to close the dropdown
                              setBrand('');
                              setTimeout(() => setBrand(b), 10);
                            }}
                          >
                            {b}
                          </div>
                        ))}
                      {!useTicketsStore.getState().settings.brands.some(
                        b => b.toLowerCase() === brand.toLowerCase()
                      ) && (
                          <div
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-indigo-600"
                            onClick={async () => {
                              // Add to global settings in the background
                              const { addBrand } = useTicketsStore.getState();
                              const currentValue = brand;
                              
                              try {
                                // Add to settings without clearing the form
                                await addBrand(currentValue);
                              } catch (error) {
                                console.error("Error adding brand:", error);
                              }
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
                  Model
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Search or add new model"
                    required
                    disabled={!brand}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission
                        return false;
                      }
                    }}
                  />
                  {model && brand && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
                      {useTicketsStore.getState().settings.models
                        .filter(m => m.brandId === brand && m.name.toLowerCase().includes(model.toLowerCase()))
                        .map((m) => (
                          <div
                            key={m.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              // Clear the search to close the dropdown
                              setModel('');
                              setTimeout(() => setModel(m.name), 10);
                            }}
                          >
                            {m.name}
                          </div>
                        ))}
                      {!useTicketsStore.getState().settings.models.some(
                        m => m.brandId === brand && m.name.toLowerCase() === model.toLowerCase()
                      ) && (
                          <div
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-indigo-600"
                            onClick={async () => {
                              // Add to global settings in the background
                              const { addModel } = useTicketsStore.getState();
                              const currentValue = model;
                              const currentBrand = brand;
                              
                              try {
                                // Add to settings without clearing the form
                                await addModel({ name: currentValue, brandId: currentBrand });
                              } catch (error) {
                                console.error("Error adding model:", error);
                              }
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
                    Assign to Technician
                  </label>
                  <select
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned</option>
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
                    Tasks
                  </label>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Total Cost: ${totalCost.toFixed(2)}
                  </div>
                </div>
                
                {/* Task search */}
                <div className="relative">
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Search or add new task"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission
                        return false;
                      }
                    }}
                  />
                  {newTaskName && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
                      {useTicketsStore.getState().settings.tasks
                        .filter(task => task.toLowerCase().includes(newTaskName.toLowerCase()))
                        .slice(0, 5)
                        .map((task) => (
                          <div
                            key={task}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              if (!tasksWithPrice.some(t => t.name === task)) {
                                setTasksWithPrice(prev => [...prev, { name: task, price: 0 }]);
                              }
                              // Clear the search to close the dropdown
                              setNewTaskName('');
                            }}
                          >
                            {task}
                          </div>
                        ))}
                      {!useTicketsStore.getState().settings.tasks.some(
                        task => task.toLowerCase() === newTaskName.toLowerCase()
                      ) && (
                        <div className="flex flex-col">
                          <div
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-indigo-600"
                            onClick={async () => {
                              const taskName = newTaskName;
                              const taskPrice = newTaskPrice;
                              
                              // Add to tasks with price
                              setTasksWithPrice(prev => [...prev, { name: taskName, price: taskPrice }]);
                              
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
                            }}
                          >
                            Add "{newTaskName}"
                          </div>
                          <div className="px-4 py-2 flex items-center">
                            <span className="mr-2">Price:</span>
                            <div className="flex items-center">
                              <span className="mr-1">$</span>
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
                    Popular Tasks
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
                              const exists = tasksWithPrice.some(t => t.name === task);
                              if (exists) {
                                setTasksWithPrice(prev => prev.filter(t => t.name !== task));
                              } else {
                                setTasksWithPrice(prev => [...prev, { name: task, price: 0 }]);
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
                      Selected Tasks
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
                              Remove
                            </button>
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {task.name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1">$</span>
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
                  Passcode (Optional)
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
                  Issue Description (Optional)
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
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'pending' | 'in-progress' | 'completed')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
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
                  }}
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
                  {loading ? (editingTicket ? 'Updating...' : 'Creating...') : (editingTicket ? 'Update Ticket' : 'Create Ticket')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tickets Table */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 flex items-center gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
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
                  Device
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tasks
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cost
                </th>
                {userRole === ROLES.SUPER_ADMIN && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Technician
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
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
                    ticket.taskPrices.map(tp => `${tp.name} ($${tp.price})`).join(', ') :
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
                        ${ticket.cost}
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
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        ) : (
                          getStatusBadge(ticket.status)
                        )}
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
                              onClick={() => setEditingTicket(ticket.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                          )}
                          
                          {/* Thermal Receipt button */}
                          <button
                            onClick={() => {
                              setNewTicketNumber(ticket.ticketNumber);
                              setSelectedClientId(ticket.clientId);
                              setShowReceipt(true);
                            }}
                            className="text-green-600 hover:text-green-800"
                            title="Print Receipt"
                          >
                            <Printer className="h-5 w-5" />
                          </button>
                          
                          {/* Invoice button */}
                          <button
                            onClick={() => {
                              setNewTicketNumber(ticket.ticketNumber);
                              setSelectedClientId(ticket.clientId);
                              setShowInvoice(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Generate Invoice"
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

      {/* Receipt Modal */}
      {showReceipt && newTicketNumber && (
        <UnifiedDocument
          data={convertTicketToDocument(
            tickets.find(t => t.ticketNumber === newTicketNumber)!,
            selectedClientId,
            clients.find(c => c.id === selectedClientId)
          )}
          onClose={() => {
            setShowReceipt(false);
            setNewTicketNumber('');
          }}
          initialFormat="thermal"
        />
      )}

      {/* Invoice Modal */}
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
