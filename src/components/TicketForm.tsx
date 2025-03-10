import React, { useState, useEffect, useRef } from 'react';
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

export default function TicketForm({ clientId, onSubmit, onCancel, editingTicket, initialData }: TicketFormProps) {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { settings, addTicket, updateTicket, addDeviceType, addBrand, addModel, addTask, loading } = useTicketsStore();
  const { user, userRole } = useAuthStore();

  const [deviceTypeSearch, setDeviceTypeSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskCost, setNewTaskCost] = useState(0);
  const [technicians, setTechnicians] = useState<any[]>([]);
  
  // Convert initial tasks to task with price objects
  const initialTasksWithPrice = initialData?.taskPrices || 
    initialData?.tasks.map(task => ({
      name: task,
      price: initialData.cost / initialData.tasks.length // Distribute cost evenly for initial data
    })) || [];

  // Use a ref to maintain form state across re-renders
  const formDataRef = useRef({
    deviceType: initialData?.deviceType || '',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    tasksWithPrice: initialTasksWithPrice,
    issue: initialData?.issue || '',
    passcode: initialData?.passcode || '',
    status: initialData?.status || 'pending' as const,
    technicianId: initialData?.technicianId || (userRole === ROLES.TECHNICIAN ? user?.uid : ''),
  });

  const [formData, setFormData] = useState(formDataRef.current);

  // Update the ref when formData changes
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        deviceType: initialData.deviceType,
        brand: initialData.brand,
        model: initialData.model,
        tasksWithPrice: initialData.taskPrices || initialData.tasks.map(task => ({
          name: task,
          price: initialData.cost / initialData.tasks.length
        })),
        issue: initialData.issue,
        passcode: initialData.passcode || '',
        status: initialData.status,
        technicianId: initialData.technicianId || (userRole === ROLES.TECHNICIAN ? user?.uid : ''),
      });

      // Set search fields to match initial data
      setDeviceTypeSearch(initialData.deviceType);
      setBrandSearch(initialData.brand);
    }
  }, [initialData, userRole, user?.uid]);

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

  // Calculate total cost from all tasks
  const totalCost = formData.tasksWithPrice.reduce((sum, task) => sum + task.price, 0);

  // Get most used tasks
  const [popularTasks, setPopularTasks] = useState<string[]>([]);
  useEffect(() => {
    const tickets = useTicketsStore.getState().tickets;
    const taskCounts = new Map<string, number>();
    tickets.forEach(ticket => {
      ticket.tasks.forEach(task => {
        taskCounts.set(task, (taskCounts.get(task) || 0) + 1);
      });
    });
    const sortedTasks = Array.from(taskCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([task]) => task)
      .slice(0, 6);
    setPopularTasks(sortedTasks);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Extract task names for the ticket
    const tasks = formData.tasksWithPrice.map(task => task.name);
    
    if (editingTicket) {
      await updateTicket(editingTicket, { 
        ...formData, 
        tasks, 
        taskPrices: formData.tasksWithPrice, // Save task prices
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
        ...formData, 
        tasks,
        taskPrices: formData.tasksWithPrice, // Save task prices
        cost: totalCost,
        clientId, 
        technicianId: formData.technicianId || '' 
      };
      const newTicketNumber = await addTicket(ticket);
      onSubmit(newTicketNumber);
    }
  };

  const handleTaskToggle = (taskName: string) => {
    const taskExists = formDataRef.current.tasksWithPrice.some(t => t.name === taskName);
    
    if (taskExists) {
      // Remove task
      formDataRef.current = {
        ...formDataRef.current,
        tasksWithPrice: formDataRef.current.tasksWithPrice.filter(t => t.name !== taskName)
      };
    } else {
      // Add task with default cost
      formDataRef.current = {
        ...formDataRef.current,
        tasksWithPrice: [...formDataRef.current.tasksWithPrice, { name: taskName, price: 0 }]
      };
    }
    
    // Update the state
    setFormData(formDataRef.current);
  };

  const updateTaskPrice = (taskName: string, price: number) => {
    formDataRef.current = {
      ...formDataRef.current,
      tasksWithPrice: formDataRef.current.tasksWithPrice.map(task => 
        task.name === taskName ? { ...task, price } : task
      )
    };
    
    // Update the state
    setFormData(formDataRef.current);
  };

  const handleDeviceTypeSelect = (type: string) => {
    // First update the form data to preserve the selection
    formDataRef.current = {
      ...formDataRef.current,
      deviceType: type
    };
    
    // Update the state
    setFormData(formDataRef.current);
    
    // Update the search field to match the selection but don't clear it
    setDeviceTypeSearch(type);
    
    // Then add the new device type if needed in the background
    if (!settings.deviceTypes.includes(type)) {
      setTimeout(() => {
        addDeviceType(type)
          .catch(error => {
            console.error("Error adding device type:", error);
          });
      }, 0);
    }
  };

  const handleBrandSelect = (brand: string) => {
    // First update the form data to preserve the selection
    // Note: We clear the model when changing brand
    formDataRef.current = {
      ...formDataRef.current,
      brand,
      model: ''
    };
    
    // Update the state
    setFormData(formDataRef.current);
    
    // Update the search field to match the selection but don't clear it
    setBrandSearch(brand);
    
    // Then add the new brand if needed in the background
    if (!settings.brands.includes(brand)) {
      setTimeout(() => {
        addBrand(brand)
          .catch(error => {
            console.error("Error adding brand:", error);
          });
      }, 0);
    }
  };

  const handleAddNewModel = () => {
    const trimmedModelName = newModelName.trim();
    if (trimmedModelName && formDataRef.current.brand) {
      // First update the form data to preserve the selection
      formDataRef.current = {
        ...formDataRef.current,
        model: trimmedModelName
      };
      
      // Update the state
      setFormData(formDataRef.current);
      
      // Clear the new model input and exit adding mode
      setNewModelName('');
      setIsAddingModel(false);
      
      // Then add the new model in the background
      setTimeout(() => {
        addModel({ name: trimmedModelName, brandId: formDataRef.current.brand })
          .catch(error => {
            console.error("Error adding new model:", error);
          });
      }, 0);
    }
  };

  const handleAddNewTask = () => {
    const value = newTaskInput.trim();
    if (value && !formDataRef.current.tasksWithPrice.some(t => t.name === value)) {
      // Create a new task
      const newTask = { name: value, price: newTaskCost };
      
      // Update the ref directly to ensure it's not lost
      formDataRef.current = {
        ...formDataRef.current,
        tasksWithPrice: [...formDataRef.current.tasksWithPrice, newTask]
      };
      
      // Then update the state
      setFormData(formDataRef.current);
      
      // Clear the inputs for the next task
      setNewTaskInput('');
      setNewTaskCost(0);
      
      // Add the task to settings in the background
      if (!settings.tasks.includes(value)) {
        // Use setTimeout to make this non-blocking
        setTimeout(() => {
          addTask(value)
            .then(() => {
              // Update popular tasks to include the new task
              setPopularTasks(prev => {
                if (prev.includes(value)) return prev;
                return [value, ...prev.slice(0, 5)];
              });
            })
            .catch(error => {
              console.error("Error adding new task:", error);
            });
        }, 0);
      }
    }
  };

  const filteredDeviceTypes = settings.deviceTypes.filter(type => 
    type.toLowerCase().includes(deviceTypeSearch.toLowerCase())
  );

  const filteredBrands = settings.brands.filter(brand => 
    brand.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const availableModels = settings.models.filter(model => 
    model.brandId === formData.brand
  );

  // Combine popular tasks with all tasks to ensure new tasks are displayed
  const displayedTasks = [...new Set([...popularTasks, ...settings.tasks.filter(task => 
    !popularTasks.includes(task) && 
    task.toLowerCase().includes(newTaskInput.toLowerCase())
  )])].slice(0, 8);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Device Type
        </label>
        <div className="relative">
          <input
            type="text"
            value={deviceTypeSearch || formData.deviceType}
            onChange={(e) => {
              setDeviceTypeSearch(e.target.value);
              if (!e.target.value) {
                setFormData({ ...formData, deviceType: '' });
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
                  onClick={() => handleDeviceTypeSelect(type)}
                >
                  {type}
                </div>
              ))}
              {!filteredDeviceTypes.includes(deviceTypeSearch) && (
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-indigo-600"
                  onClick={() => handleDeviceTypeSelect(deviceTypeSearch)}
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
            value={brandSearch || formData.brand}
            onChange={(e) => {
              setBrandSearch(e.target.value);
              if (!e.target.value) {
                setFormData({ ...formData, brand: '', model: '' });
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
                  onClick={() => handleBrandSelect(brand)}
                >
                  {brand}
                </div>
              ))}
              {!filteredBrands.includes(brandSearch) && (
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-indigo-600"
                  onClick={() => handleBrandSelect(brandSearch)}
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
                  handleAddNewModel();
                  return false;
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddNewModel}
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
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
            {formData.brand && (
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
            value={formData.technicianId}
            onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
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
                  checked={formData.tasksWithPrice.some(t => t.name === task)}
                  onChange={() => handleTaskToggle(task)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  {task}
                  {!popularTasks.includes(task) && formData.tasksWithPrice.some(t => t.name === task) && (
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
                  handleAddNewTask();
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
                    handleAddNewTask();
                    return false; // Ensure no other handlers are triggered
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleAddNewTask}
              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          
          {/* Selected tasks with cost */}
          {formData.tasksWithPrice.length > 0 && (
            <div className="mt-4">
              <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Selected Tasks
              </h4>
              <div className="space-y-2 border rounded-md p-3">
                {formData.tasksWithPrice.map((task) => (
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
                        onChange={(e) => updateTaskPrice(task.name, Number(e.target.value))}
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
          value={formData.passcode}
          onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
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
          value={formData.issue}
          onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
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
