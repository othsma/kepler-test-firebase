import React, { useState, useEffect } from 'react';
import { useThemeStore, useTicketsStore } from '../lib/store';
import { Plus, Edit2, Trash2, Smartphone, Tag, Cog as SettingsIcon, CheckSquare, Search, ChevronDown, ChevronRight, BarChart3, Filter, Expand, Minimize2 } from 'lucide-react';

export default function Settings() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const {
    settings,
    addDeviceType,
    removeDeviceType,
    updateDeviceType,
    addBrand,
    removeBrand,
    updateBrand,
    addModel,
    removeModel,
    updateModel,
    addTask,
    removeTask,
    updateTask,
    tickets,
  } = useTicketsStore();

  const [newDeviceType, setNewDeviceType] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState({ name: '', brandId: '' });
  const [newTask, setNewTask] = useState('');
  const [editingItem, setEditingItem] = useState<{ type: string; value: string; id?: string }>({ type: '', value: '' });
  const [activeTab, setActiveTab] = useState<'deviceTypes' | 'brands' | 'models' | 'tasks'>(() => {
    try {
      const saved = localStorage.getItem('settingsActiveTab');
      return (saved as 'deviceTypes' | 'brands' | 'models' | 'tasks') || 'deviceTypes';
    } catch {
      return 'deviceTypes';
    }
  });
  const [modelSearch, setModelSearch] = useState('');
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState('');

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('settingsActiveTab', activeTab);
    } catch (error) {
      console.error('Error saving active tab to localStorage:', error);
    }
  }, [activeTab]);

  // Clear error message when switching tabs or when inputs change
  useEffect(() => {
    setErrorMessage('');
  }, [activeTab, newDeviceType, newBrand, newModel, newTask]);

  const handleSubmit = (type: string) => {
    setErrorMessage('');

    switch (type) {
      case 'deviceType':
        if (newDeviceType.trim()) {
          const trimmedType = newDeviceType.trim();
          // Check for duplicates (case-insensitive)
          if (settings.deviceTypes.some(type => type.toLowerCase() === trimmedType.toLowerCase())) {
            setErrorMessage(`Le type d'appareil "${trimmedType}" existe déjà.`);
            return;
          }
          addDeviceType(trimmedType);
          setNewDeviceType('');
        }
        break;
      case 'brand':
        if (newBrand.trim()) {
          const trimmedBrand = newBrand.trim();
          // Check for duplicates (case-insensitive)
          if (settings.brands.some(brand => brand.toLowerCase() === trimmedBrand.toLowerCase())) {
            setErrorMessage(`La marque "${trimmedBrand}" existe déjà.`);
            return;
          }
          addBrand(trimmedBrand);
          setNewBrand('');
        }
        break;
      case 'model':
        if (newModel.name.trim() && newModel.brandId) {
          const trimmedModelName = newModel.name.trim();
          // Check for duplicates within the same brand (case-insensitive)
          if (settings.models.some(model =>
            model.brandId === newModel.brandId &&
            model.name.toLowerCase() === trimmedModelName.toLowerCase()
          )) {
            const brandName = settings.brands.find(brand => brand === newModel.brandId) || newModel.brandId;
            setErrorMessage(`Le modèle "${trimmedModelName}" existe déjà pour la marque "${brandName}".`);
            return;
          }
          addModel({ name: trimmedModelName, brandId: newModel.brandId });
          setNewModel({ name: '', brandId: '' });
        }
        break;
      case 'task':
        if (newTask.trim()) {
          const trimmedTask = newTask.trim();
          // Check for duplicates (case-insensitive)
          if (settings.tasks.some(task => task.toLowerCase() === trimmedTask.toLowerCase())) {
            setErrorMessage(`La tâche "${trimmedTask}" existe déjà.`);
            return;
          }
          addTask(trimmedTask);
          setNewTask('');
        }
        break;
    }
  };

  const handleEdit = (type: string, value: string, id?: string) => {
    if (editingItem.type === type && editingItem.value === value) {
      setEditingItem({ type: '', value: '' });
      return;
    }
    setEditingItem({ type, value, id });
  };

  const handleUpdate = (type: string, oldValue: string, newValue: string, id?: string) => {
    switch (type) {
      case 'deviceType':
        updateDeviceType(oldValue, newValue);
        break;
      case 'brand':
        updateBrand(oldValue, newValue);
        break;
      case 'model':
        if (id) updateModel(id, newValue);
        break;
      case 'task':
        updateTask(oldValue, newValue);
        break;
    }
    setEditingItem({ type: '', value: '' });
  };

  // Calculate brand usage statistics
  const getBrandUsageCount = (brandName: string) => {
    return tickets.filter(ticket => {
      // Check if ticket directly references this brand
      if (ticket.brand === brandName) return true;

      // Check if any of the ticket's tasks reference models from this brand
      return ticket.tasks.some(task => {
        return settings.models
          .filter(model => model.brandId === brandName)
          .some(model => task.toLowerCase().includes(model.name.toLowerCase()));
      });
    }).length;
  };

  const tabs = [
    { id: 'deviceTypes', label: 'Types d\'appareils', icon: Smartphone },
    { id: 'brands', label: 'Marques', icon: Tag },
    { id: 'models', label: 'Modèles', icon: SettingsIcon },
    { id: 'tasks', label: 'Tâches', icon: CheckSquare },
  ];

  return (
    <div className="space-y-6">
      <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Paramètres
      </h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage('')}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-red-700 text-xl">×</span>
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
        {activeTab === 'deviceTypes' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="h-5 w-5 text-indigo-600" />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Types d'appareils
              </h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDeviceType}
                onChange={(e) => setNewDeviceType(e.target.value)}
                placeholder="Ajouter un nouveau type d'appareil"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleSubmit('deviceType')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {settings.deviceTypes.map((type) => (
                <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  {editingItem.type === 'deviceType' && editingItem.value === type ? (
                    <input
                      type="text"
                      defaultValue={type}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdate('deviceType', type, e.currentTarget.value);
                        }
                      }}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      autoFocus
                    />
                  ) : (
                    <span>{type}</span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit('deviceType', type)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeDeviceType(type)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'brands' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-indigo-600" />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Marques
              </h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Ajouter une nouvelle marque"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleSubmit('brand')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {settings.brands.map((brand) => (
                <div key={brand} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  {editingItem.type === 'brand' && editingItem.value === brand ? (
                    <input
                      type="text"
                      defaultValue={brand}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdate('brand', brand, e.currentTarget.value);
                        }
                      }}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      autoFocus
                    />
                  ) : (
                    <span>{brand}</span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit('brand', brand)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeBrand(brand)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-indigo-600" />
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Modèles
                </h2>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ({settings.models.length} modèles au total)
                </span>
              </div>

              {/* Expand/Collapse Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const brandsWithModels = settings.brands.filter(brand =>
                      settings.models.some(model => model.brandId === brand)
                    );
                    const allExpanded = brandsWithModels.every(brand => expandedBrands.has(brand));

                    if (allExpanded) {
                      // Collapse all
                      setExpandedBrands(new Set());
                    } else {
                      // Expand all
                      setExpandedBrands(new Set(brandsWithModels));
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                >
                  {(() => {
                    const brandsWithModels = settings.brands.filter(brand =>
                      settings.models.some(model => model.brandId === brand)
                    );
                    const allExpanded = brandsWithModels.every(brand => expandedBrands.has(brand));
                    const Icon = allExpanded ? Minimize2 : Expand;

                    return (
                      <>
                        <Icon className="h-4 w-4" />
                        {allExpanded ? 'Tout replier' : 'Tout déplier'}
                      </>
                    );
                  })()}
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="Rechercher des modèles..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {settings.brands.filter(brand =>
                      settings.models.some(model =>
                        model.brandId === brand &&
                        (modelSearch === '' || model.name.toLowerCase().includes(modelSearch.toLowerCase()))
                      )
                    ).length} marque{settings.brands.filter(brand =>
                      settings.models.some(model => model.brandId === brand)
                    ).length > 1 ? 's' : ''} visible{settings.brands.filter(brand =>
                      settings.models.some(model => model.brandId === brand)
                    ).length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Add New Model Section */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Ajouter un nouveau modèle</h3>
              <div className="flex gap-2">
                <select
                  value={newModel.brandId}
                  onChange={(e) => setNewModel({ ...newModel, brandId: e.target.value })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Sélectionner une marque</option>
                  {settings.brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  placeholder="Nom du modèle"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={!newModel.brandId}
                />
                <button
                  onClick={() => handleSubmit('model')}
                  disabled={!newModel.brandId || !newModel.name.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Models Grouped by Brand */}
            <div className="space-y-4">
              {settings.brands.map((brand) => {
                const brandModels = settings.models.filter(model =>
                  model.brandId === brand &&
                  (modelSearch === '' || model.name.toLowerCase().includes(modelSearch.toLowerCase()))
                );
                if (brandModels.length === 0) return null;

                const isExpanded = expandedBrands.has(brand);

                return (
                  <div key={brand} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div
                      className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      onClick={() => {
                        const newExpanded = new Set(expandedBrands);
                        if (isExpanded) {
                          newExpanded.delete(brand);
                        } else {
                          newExpanded.add(brand);
                        }
                        setExpandedBrands(newExpanded);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-indigo-600" />
                          )}
                          <Tag className="h-4 w-4 text-indigo-600" />
                          <h4 className="font-medium text-indigo-900 dark:text-indigo-100">{brand}</h4>
                          <span className="text-sm text-indigo-600 dark:text-indigo-400">
                            ({brandModels.length} modèle{brandModels.length > 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-indigo-500" />
                          <span className="text-xs text-indigo-600 dark:text-indigo-400">
                            Utilisé dans {getBrandUsageCount(brand)} ticket{getBrandUsageCount(brand) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="divide-y divide-gray-200 dark:divide-gray-600">
                        {brandModels.map((model) => (
                          <div key={model.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                            {editingItem.type === 'model' && editingItem.id === model.id ? (
                              <input
                                type="text"
                                defaultValue={model.name}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdate('model', model.name, e.currentTarget.value, model.id);
                                  }
                                }}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <SettingsIcon className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{model.name}</span>
                                {modelSearch && model.name.toLowerCase().includes(modelSearch.toLowerCase()) && (
                                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                    Correspondance
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit('model', model.name, model.id)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Modifier"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => removeModel(model.id)}
                                className="p-1 text-gray-400 hover:text-red-500"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Show brands without models */}
              {settings.brands.filter(brand => !settings.models.some(model => model.brandId === brand)).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Marques sans modèles ({settings.brands.filter(brand => !settings.models.some(model => model.brandId === brand)).length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {settings.brands
                      .filter(brand => !settings.models.some(model => model.brandId === brand))
                      .map((brand) => (
                        <div key={brand} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{brand}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {settings.models.length === 0 && (
                <div className="text-center py-8">
                  <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Aucun modèle trouvé
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Commencez par ajouter des marques, puis créez des modèles associés.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="h-5 w-5 text-indigo-600" />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Tâches
              </h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Ajouter une nouvelle tâche"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleSubmit('task')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {settings.tasks.map((task) => (
                <div key={task} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  {editingItem.type === 'task' && editingItem.value === task ? (
                    <input
                      type="text"
                      defaultValue={task}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdate('task', task, e.currentTarget.value);
                        }
                      }}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      autoFocus
                    />
                  ) : (
                    <span>{task}</span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit('task', task)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeTask(task)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
