import React, { useState, useEffect } from 'react';
import { useThemeStore, useTicketsStore, TaskWithPrice, useAuthStore } from '../lib/store';
import { Plus, Minus, DollarSign } from 'lucide-react';
import { getAllTechnicians, ROLES } from '../lib/firebase';

interface TicketFormProps {
  clientId?: string;
  onSubmit: (ticketNumber: string) => void;
  onCancel: () => void;
  editingTicket?: string | null;
  initialData?: {
    deviceType: string;
    brand: string;
    model: string;
    tasks: string[];
    taskPrices?: TaskWithPrice[]; // Add task prices
    issue: string;
    cost: number;
    passcode: string;
    status: 'pending' | 'in-progress' | 'completed';
    technicianId?: string;
  };
}

export default function NewTicketForm({ clientId, onSubmit, onCancel, editingTicket, initialData }: TicketFormProps) {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { settings, addTicket, updateTicket, loading } = useTicketsStore();
  const { user, userRole } = useAuthStore();

  // State for form data
  const [deviceType, setDeviceType] = useState(initialData?.deviceType || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [tasksWithPrice, setTasksWithPrice] = useState<TaskWithPrice[]>(
    initialData?.taskPrices || 
    initialData?.tasks.map(task => ({
      name: task,
      price: initialData.cost / initialData.tasks.length
    })) || []
  );
  const [issue, setIssue] = useState(initialData?.issue || '');
  const [passcode, setPasscode] = useState(initialData?.passcode || '');
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'completed'>(
    initialData?.status || 'pending'
  );
  const [technicianId, setTechnicianId] = useState(
    initialData?.technicianId || (userRole === ROLES.TECHNICIAN ? user?.uid : '') || ''
  );

  // State for UI controls
  const [deviceTypeSearch, setDeviceTypeSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskCost, setNewTaskCost] = useState(0);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [popularTasks, setPopularTasks] = useState<string[]>([]);
  const [localSettings, setLocalSettings] = useState(settings);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setDeviceType(initialData.deviceType || '');
      setBrand(initialData.brand || '');
      setModel(initialData.model || '');
      setTasksWithPrice(
        initialData.taskPrices || 
        initialData.tasks.map(task => ({
          name: task,
          price: initialData.cost / (initialData.tasks.length || 1)
        })) || []
      );
      setIssue(initialData.issue || '');
      setPasscode(initialData.passcode || '');
      setStatus(initialData.status || 'pending');
      setTechnicianId(initialData.technicianId || (userRole === ROLES.TECHNICIAN ? user?.uid : '') || '');

      // Set search fields to match initial data
      setDeviceTypeSearch(initialData.deviceType || '');
      setBrandSearch(initialData.brand || '');
    }
  }, [initialData, userRole, user]);

  // Fetch technicians for super admin
  useEffect(() => {
    const fetchTechnicians = async () => {
      if (userRole === ROLES.SUPER_ADMIN) {
        const techList = await getAllTechnicians();
        setTechnicians(techList);
      }
    };
    
    fetchTechnicians();
  }, [userRole]);

  // Get most used tasks
  useEffect(() => {
    try {
      const tickets = useTicketsStore.getState().tickets || [];
      const taskCounts = new Map<string, number>();
      
      tickets.forEach(ticket => {
        if (ticket.tasks && Array.isArray(ticket.tasks)) {
          ticket.tasks.forEach(task => {
            if (task) {
              taskCounts.set(task, (taskCounts.get(task) || 0) + 1);
            }
          });
        }
      });
      
      const sortedTasks = Array.from(taskCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([task]) => task)
        .slice(0, 6);
        
      setPopularTasks(sortedTasks);
    } catch (error) {
      console.error("Error getting popular tasks:", error);
      setPopularTasks([]);
    }
  }, []);

  // Calculate total cost from all tasks
  const totalCost = tasksWithPrice.reduce((sum, task) => sum + task.price, 0);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Extract task names for the ticket
      const tasks = tasksWithPrice.map(task => task.name);
      
      if (editingTicket) {
        await updateTicket(editingTicket, { 
          deviceType,
          brand,
          model,
          tasks, 
          taskPrices: tasksWithPrice,
          issue,
          passcode,
          status,
          technicianId,
          cost: totalCost,
          clientId 
        });
        onSubmit('');
      } else {
        if (!clientId) {
          alert('Please select a client first');
          return;
        }
        
        const ticket = { 
          deviceType,
          brand,
          model,
          tasks,
          taskPrices: tasksWithPrice,
          issue,
          passcode,
          status,
          cost: totalCost,
          clientId, 
          technicianId: technicianId || '' 
        };
        const newTicketNumber = await addTicket(ticket);
        onSubmit(newTicketNumber);
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
      alert("An error occurred while saving the ticket. Please try again.");
    }
  };

  // Handle adding a new device type
  const handleAddDeviceType = (type: string) => {
    setDeviceType(type);
    setDeviceTypeSearch(type);
    
    // Add to local settings if it doesn't exist
    if (!localSettings.deviceTypes.includes(type)) {
      setLocalSettings(prev => ({
        ...prev,
        deviceTypes: [...prev.deviceTypes, type]
      }));
      
      // Add to global settings in the background
      const { addDeviceType } = useTicketsStore.getState();
      setTimeout(() => {
        addDeviceType(type).catch(error => {
          console.error("Error adding device type:", error);
        });
      }, 0);
    }
  };

  // Handle adding a new brand
  const handleAddBrand = (brand: string) => {
    setBrand(brand);
    setModel(''); // Clear model when changing brand
    setBrandSearch(brand);
    
    // Add to local settings if it doesn't exist
    if (!localSettings.brands.includes(brand)) {
      setLocalSettings(prev => ({
        ...prev,
        brands: [...prev.brands, brand]
      }));
      
      // Add to global settings in the background
      const { addBrand } = useTicketsStore.getState();
      setTimeout(() => {
        addBrand(brand).catch(error => {
          console.error("Error adding brand:", error);
        });
      }, 0);
    }
  };

  // Handle adding a new model
  const handleAddModel = () => {
    const trimmedModelName = newModelName.trim();
    if (trimmedModelName && brand) {
      setModel(trimmedModelName);
      setNewModelName('');
      setIsAddingModel(false);
      
      // Add to local settings if it doesn't exist
      const modelExists = localSettings.models.some(m => 
        m.name === trimmedModelName && m.brandId === brand
      );
      
      if (!modelExists) {
        const newModel = { id: `temp-${Date.now()}`, name: trimmedModelName, brandId: brand };
        setLocalSettings(prev => ({
          ...prev,
          models: [...prev.models, newModel]
        }));
        
        // Add to global settings in the background
        const { addModel } = useTicketsStore.getState();
        setTimeout(() => {
          addModel({ name: trimmedModelName, brandId: brand }).catch(error => {
            console.error("Error adding model:", error);
          });
        }, 0);
      }
    }
  };

  // Handle adding a new task
  const handleAddTask = () => {
    const value = newTaskInput.trim();
    if (value && !tasksWithPrice.some(t => t.name === value)) {
      // Add to tasks with price
      const newTask = { name: value, price: newTaskCost };
      setTasksWithPrice(prev => [...prev, newTask]);
      
      // Clear inputs
      setNewTaskInput('');
      setNewTaskCost(0);
      
      // Add to local settings if it doesn't exist
      if (!localSettings.tasks.includes(value)) {
        setLocalSettings(prev => ({
          ...prev,
          tasks: [...prev.tasks, value]
        }));
        
        // Add to global settings in the background
        const { addTask } = useTicketsStore.getState();
        setTimeout(() => {
          addTask(value).then(() => {
            // Update popular tasks to include the new task
            setPopularTasks(prev => {
              if (prev.includes(value)) return prev;
              return [value, ...prev.slice(0, 5)];
            });
          }).catch(error => {
            console.error("Error adding task:", error);
          });
        }, 0);
      }
    }
  };

  // Handle toggling a task
  const handleTaskToggle = (taskName: string) => {
    const taskExists = tasksWithPrice.some(t => t.name === taskName);
    
    if (taskExists) {
      // Remove task
      setTasksWithPrice(prev => prev.filter(t => t.name !== taskName));
    } else {
      // Add task with default cost
      setTasksWithPrice(prev => [...prev, { name: taskName, price: 0 }]);
    }
  };

  // Handle updating task price
  const handleUpdateTaskPrice = (taskName: string, price: number) => {
    setTasksWithPrice(prev => 
      prev.map(task => task.name === taskName ? { ...task, price } : task)
    );
  };

  // Filter device types based on search
  const filteredDeviceTypes = (localSettings.deviceTypes || []).filter(type => 
    type && type.toLowerCase().includes((deviceTypeSearch || '').toLowerCase())
  );

  // Filter brands based on search
  const filteredBrands = (localSettings.brands || []).filter(brand => 
    brand && brand.toLowerCase().includes((brandSearch || '').toLowerCase())
  );

  // Filter models based on selected brand
  const availableModels = (localSettings.models || []).filter(model => 
    model && model.brandId === brand
  );

  // Combine popular tasks with all tasks for display
  const displayedTasks = [...new Set([
    ...popularTasks, 
    ...(localSettings.tasks || []).filter(task => 
      task && !popularTasks.includes(task) && 
      task.toLowerCase().includes((newTaskInput || '').toLowerCase())
    )
  ])].slice(0, 8);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Device Type
        </label>
        <div className="relative">
          <input
            type="text"
            value={deviceTypeSearch}
            onChange={(e) => {
              setDeviceTypeSearch(e.target.value);
              if (!e.target.value) {
                setDeviceType('');
              }
            }}
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
          {deviceTypeSearch && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
              {filteredDeviceTypes.map((type) => (
                <div
                  key={type}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleAddDeviceType(type)}
                >
                  {type}
                </div>
              ))}
              {!filteredDeviceTypes.includes(deviceTypeSearch) && (
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-indigo-600"
                  onClick={() => handleAddDeviceType(deviceTypeSearch)}
                >
                  Add "{deviceTypeSearch}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Brand
        </label>
        <div className="relative">
          <input
            type="text"
            value={brandSearch}
            onChange={(e) => {
              setBrandSearch(e.target.value);
              if (!e.target.value) {
                setBrand('');
                setModel('');
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
          {brandSearch && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
              {filteredBrands.map((brand) => (
                <div
                  key={brand}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleAddBrand(brand)}
                >
                  {brand}
                </div>
              ))}
              {!filteredBrands.includes(brandSearch) && (
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-indigo-600"
                  onClick={() => handleAddBrand(brandSearch)}
                >
                  Add "{brandSearch}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Model
        </label>
        {isAddingModel ? (
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="Enter new model name"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent form submission
                  handleAddModel();
                  return false;
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddModel}
              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingModel(false);
                setNewModelName('');
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mt-1">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select a model</option>
              {availableModels.map((model) => (
                <option key={model.id} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
            {brand && (
              <button
                type="button"
                onClick={() => setIsAddingModel(true)}
                className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                New
              </button>
            )}
          </div>
        )}
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

      <div>
        <div className="flex justify-between items-center">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Tasks
          </label>
          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Total Cost: ${totalCost.toFixed(2)}
          </div>
        </div>
        
        <div className="mt-2 space-y-4">
          {/* Task selection */}
          <div className="grid grid-cols-2 gap-2">
            {displayedTasks.map((task) => (
              <label key={task} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={tasksWithPrice.some(t => t.name === task)}
                  onChange={() => handleTaskToggle(task)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  {task}
                  {!popularTasks.includes(task) && tasksWithPrice.some(t => t.name === task) && (
                    <span className="ml-1 text-green-600">✓</span>
                  )}
                </span>
              </label>
            ))}
          </div>
          
          {/* Add new task with cost */}
          <div className="flex gap-2 items-center mt-2">
            <input
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder="Add new task"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent form submission
                  handleAddTask();
                  return false; // Ensure no other handlers are triggered
                }
              }}
            />
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <input
                type="number"
                value={newTaskCost}
                onChange={(e) => setNewTaskCost(Number(e.target.value))}
                placeholder="Cost"
                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission
                    handleAddTask();
                    return false; // Ensure no other handlers are triggered
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleAddTask}
              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          
          {/* Selected tasks with cost */}
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
                        onClick={() => handleTaskToggle(task.name)}
                        className="mr-2 text-red-500 hover:text-red-700"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {task.name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={task.price}
                        onChange={(e) => handleUpdateTaskPrice(task.name, Number(e.target.value))}
                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault(); // Prevent form submission
                            return false;
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Passcode (Optional)
        </label>
        <input
          type="text"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // Prevent form submission
              return false;
            }
          }}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Issue Description (Optional)
        </label>
        <textarea
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault(); // Prevent form submission
              return false;
            }
          }}
        />
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
          {loading ? (editingTicket ? 'Updating...' : 'Creating...') : (editingTicket ? 'Update Ticket' : 'Create Ticket')}
        </button>
      </div>
    </form>
  );
}
