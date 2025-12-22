import React, { useState, useEffect } from 'react';
import { useThemeStore, useProductsStore } from '../lib/store';
import { Search, Plus, Edit2, Trash2, Package, ChevronDown, ChevronRight } from 'lucide-react';

export default function Products() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { products, categories, selectedCategory, setSearchQuery, setSelectedCategory, addProduct, updateProduct, deleteProduct } = useProductsStore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'all'>('all');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    sku: '',
    description: '',
    imageUrl: '',
    createdAt: '',
  });

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'createdAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Local search state - independent of store
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockRange, setStockRange] = useState({ min: '', max: '' });
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [useLoadMore, setUseLoadMore] = useState(false);
  const [loadedItemsCount, setLoadedItemsCount] = useState(10);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(localSearchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category || '');

    // Advanced filters
    const matchesPrice = (!priceRange.min || product.price >= Number(priceRange.min)) &&
      (!priceRange.max || product.price <= Number(priceRange.max));
    const matchesStock = (!stockRange.min || product.stock >= Number(stockRange.min)) &&
      (!stockRange.max || product.stock <= Number(stockRange.max));
    const matchesDate = (!dateRange.from || new Date(product.createdAt) >= new Date(dateRange.from)) &&
      (!dateRange.to || new Date(product.createdAt) <= new Date(dateRange.to));

    return matchesSearch && matchesCategory && matchesPrice && matchesStock && matchesDate;
  });

  // Sorting functionality
  const sortedAndFilteredProducts = [...filteredProducts].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle different data types
    if (sortField === 'createdAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedAndFilteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Get current page items with optimized memoization (pagination mode) or loaded items (load more mode)
  const displayedProducts = useLoadMore
    ? sortedAndFilteredProducts.slice(0, loadedItemsCount)
    : sortedAndFilteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setLoadedItemsCount(10);
  }, [localSearchQuery, selectedCategories, priceRange, stockRange, dateRange, sortField, sortDirection]);

  const handleSort = (field: 'name' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct, formData);
      setEditingProduct(null);
      setActiveTab('all'); // Switch back to all products after editing
    } else {
      addProduct(formData);
      setActiveTab('all'); // Switch to all products after adding
    }
    setFormData({
      name: '',
      category: '',
      price: 0,
      stock: 0,
      sku: '',
      description: '',
      imageUrl: '',
      createdAt: '',
    });
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // URL state management - Debounced to prevent excessive updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
    // Update URL with current state
    const url = new URL(window.location.href);
    if (localSearchQuery) {
      url.searchParams.set('search', localSearchQuery);
    } else {
      url.searchParams.delete('search');
    }

      if (selectedCategories.length > 0) {
        url.searchParams.set('categories', selectedCategories.join(','));
      } else {
        url.searchParams.delete('categories');
      }

      if (priceRange.min) {
        url.searchParams.set('priceMin', priceRange.min);
      } else {
        url.searchParams.delete('priceMin');
      }

      if (priceRange.max) {
        url.searchParams.set('priceMax', priceRange.max);
      } else {
        url.searchParams.delete('priceMax');
      }

      if (stockRange.min) {
        url.searchParams.set('stockMin', stockRange.min);
      } else {
        url.searchParams.delete('stockMin');
      }

      if (stockRange.max) {
        url.searchParams.set('stockMax', stockRange.max);
      } else {
        url.searchParams.delete('stockMax');
      }

      if (dateRange.from) {
        url.searchParams.set('dateFrom', dateRange.from);
      } else {
        url.searchParams.delete('dateFrom');
      }

      if (dateRange.to) {
        url.searchParams.set('dateTo', dateRange.to);
      } else {
        url.searchParams.delete('dateTo');
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

      // Update URL without triggering navigation
      window.history.replaceState({}, '', url.toString());
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, selectedCategories, priceRange, stockRange, dateRange, sortField, sortDirection]);

  // Load state from URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);

    const search = url.searchParams.get('search');
    if (search) setLocalSearchQuery(search);

    const categoriesParam = url.searchParams.get('categories');
    if (categoriesParam) {
      const categoryList = categoriesParam.split(',').filter(cat => categories.includes(cat));
      setSelectedCategories(categoryList);
    }

    const priceMin = url.searchParams.get('priceMin');
    const priceMax = url.searchParams.get('priceMax');
    if (priceMin || priceMax) {
      setPriceRange({ min: priceMin || '', max: priceMax || '' });
    }

    const stockMin = url.searchParams.get('stockMin');
    const stockMax = url.searchParams.get('stockMax');
    if (stockMin || stockMax) {
      setStockRange({ min: stockMin || '', max: stockMax || '' });
    }

    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    if (dateFrom || dateTo) {
      setDateRange({ from: dateFrom || '', to: dateTo || '' });
    }

    const sort = url.searchParams.get('sort');
    if (['name', 'createdAt'].includes(sort || '')) setSortField(sort as any);

    const dir = url.searchParams.get('dir');
    if (['asc', 'desc'].includes(dir || '')) setSortDirection(dir as any);
  }, [categories]); // Only run on mount and when categories change

  // Keyboard shortcuts for pagination
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Only handle shortcuts on the products page
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Produits
        </h1>
          <button
            onClick={() => {
              setActiveTab('main');
              setFormData({
                name: '',
                category: '',
                price: 0,
                stock: 0,
                sku: '',
                description: '',
                imageUrl: '',
                createdAt: '',
              });
              setEditingProduct(null);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter un produit
          </button>
      </div>

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
            <Package className="h-4 w-4" />
            Créer un produit
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Search className="h-4 w-4" />
            Tous les produits ({products.length})
          </button>
        </nav>
      </div>

      {/* Main Tab - Product Creation Form ONLY */}
      {activeTab === 'main' && (
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-5 w-5 text-indigo-600" />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {editingProduct ? 'Modifier le produit' : 'Créer un nouveau produit'}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nom
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
                Catégorie (optionnel)
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Aucune catégorie</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Prix
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Stock
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                URL de l'image
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  setEditingProduct(null);
                  setFormData({
                    name: '',
                    category: '',
                    price: 0,
                    stock: 0,
                    sku: '',
                    description: '',
                    imageUrl: '',
                    createdAt: '',
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {editingProduct ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* All Products Tab - Product Listing ONLY */}
      {activeTab === 'all' && (
        <>
          {/* Search and filtering controls */}
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-4`}>
            <div className="flex flex-col gap-4">
              {/* Search bar */}
              <div className="flex items-center gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>

              {/* Filters and Sort buttons */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Category filter */}
                <div className="relative min-w-[200px]">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className={`w-full flex items-center justify-between rounded-lg border shadow-sm px-3 py-2 text-left text-sm ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:border-indigo-500 focus:ring-indigo-500`}
                  >
                    <span className="block truncate">
                      {selectedCategories.length === 0
                        ? 'Toutes les catégories'
                        : `${selectedCategories.length} cat.`
                      }
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
                  </button>

                  {showCategoryDropdown && (
                    <>
                      {/* Click outside overlay */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowCategoryDropdown(false)}
                      />
                      <div className={`absolute z-20 mt-1 w-full rounded-md shadow-lg border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <div className="p-2 max-h-60 overflow-auto">
                          {/* Select All / Clear All */}
                          <div className="flex items-center justify-between px-2 py-1 border-b border-gray-200 dark:border-gray-600 mb-2">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Catégories
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedCategories(categories)}
                                className="text-xs text-indigo-600 hover:text-indigo-800"
                              >
                                Tout
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedCategories([])}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Effacer
                              </button>
                            </div>
                          </div>

                          {/* Category checkboxes */}
                          {categories.map((category) => (
                            <label
                              key={category}
                              className={`flex items-center px-2 py-2 rounded-md cursor-pointer ${
                                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(category)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCategories([...selectedCategories, category]);
                                  } else {
                                    setSelectedCategories(selectedCategories.filter(c => c !== category));
                                  }
                                }}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {category}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Sort buttons */}
                <div className="flex gap-2 flex-wrap">
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

              {/* Selected categories chips */}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedCategories.map((category) => (
                    <span
                      key={category}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {category}
                      <button
                        type="button"
                        onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== category))}
                        className={`ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full ${
                          isDarkMode ? 'hover:bg-indigo-800 text-indigo-400' : 'hover:bg-indigo-200 text-indigo-600'
                        }`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Advanced Filters Toggle */}
              <div className="flex items-center justify-between border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-2 text-sm font-medium ${
                    isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                  Filtres avancés
                </button>

                {/* Clear Filters Button */}
                {(selectedCategories.length > 0 || priceRange.min || priceRange.max || stockRange.min || stockRange.max || dateRange.from || dateRange.to || localSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategories([]);
                      setPriceRange({ min: '', max: '' });
                      setStockRange({ min: '', max: '' });
                      setDateRange({ from: '', to: '' });
                      setLocalSearchQuery('');
                    }}
                    className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Effacer tous les filtres
                  </button>
                )}
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className={`border-t pt-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Price Range */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Prix (€)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                          className={`flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                          }`}
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                          className={`flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Stock Range */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Stock
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={stockRange.min}
                          onChange={(e) => setStockRange({ ...stockRange, min: e.target.value })}
                          className={`flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                          }`}
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={stockRange.max}
                          onChange={(e) => setStockRange({ ...stockRange, max: e.target.value })}
                          className={`flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Date de création
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                          className={`flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                          }`}
                        />
                        <input
                          type="date"
                          value={dateRange.to}
                          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                          className={`flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* View Mode Toggle - Always Visible */}
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-4`}>
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Mode d'affichage:
              </span>
              <div className="flex rounded-md border border-gray-300">
                <button
                  onClick={() => {
                    setUseLoadMore(false);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm rounded-l-md ${
                    !useLoadMore
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Pagination
                </button>
                <button
                  onClick={() => {
                    setUseLoadMore(true);
                    setLoadedItemsCount(10);
                  }}
                  className={`px-4 py-2 text-sm rounded-r-md ${
                    useLoadMore
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Charger plus
                </button>
              </div>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {!useLoadMore ? `${totalPages} page${totalPages > 1 ? 's' : ''}` : `${Math.ceil(sortedAndFilteredProducts.length / 10)} chargement${Math.ceil(sortedAndFilteredProducts.length / 10) > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          {/* Product listing */}
          <div className="space-y-4">
            {filteredProducts.length === 0 ? (
              <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-8 text-center`}>
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {localSearchQuery ? 'Aucun produit trouvé' : 'Aucun produit enregistré'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {localSearchQuery ? 'Essayez une recherche différente' : 'Commencez par créer votre premier produit'}
                </p>
              </div>
            ) : (
              displayedProducts.map((product) => {
                const isExpanded = expandedProducts.has(product.id);

                return (
                  <div
                    key={product.id}
                    className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}
                  >
                    <div className="p-4">
                      {/* Essential Info - Always Visible */}
                      <div
                        className={`flex justify-between items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors px-4 py-3 -mx-4 -my-3 rounded-lg ${
                          isExpanded ? 'bg-gray-50 dark:bg-gray-700/30' : ''
                        }`}
                        onClick={(e) => {
                          // Prevent expansion if clicking on action buttons
                          if ((e.target as Element).closest('button')) return;
                          toggleProductExpansion(product.id);
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-indigo-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-indigo-600" />
                            )}
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {product.name}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {product.category || 'Sans catégorie'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>€{product.price}</span>
                              <span>Stock: {product.stock}</span>
                              <span className={`text-xs ${product.stock <= 5 ? 'text-red-600 font-medium' : product.stock <= 10 ? 'text-yellow-600' : 'text-gray-500'}`}>
                                {product.stock <= 5 ? '⚠️ Stock faible!' : product.stock <= 10 ? '⚠️ Stock limité' : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProduct(product.id);
                              setActiveTab('main');
                              setFormData({
                                name: product.name,
                                category: product.category,
                                price: product.price,
                                stock: product.stock,
                                sku: product.sku,
                                description: product.description,
                                imageUrl: product.imageUrl,
                                createdAt: product.createdAt || '',
                              });
                            }}
                            className="p-2 text-gray-400 hover:text-gray-500"
                            title="Modifier"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
                                deleteProduct(product.id);
                              }
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {product.description}
                              </p>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  SKU
                                </p>
                                <p className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {product.sku}
                                </p>
                              </div>
                              <div>
                                <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Prix de vente
                                </p>
                                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  €{product.price}
                                </p>
                              </div>
                              <div>
                                <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Stock disponible
                                </p>
                                <p className={`text-sm ${product.stock <= 5 ? 'text-red-600 font-medium' : product.stock <= 10 ? 'text-yellow-600' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {product.stock} unités
                                </p>
                              </div>
                              <div>
                                <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Catégorie
                                </p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {product.category || 'Aucune catégorie'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Load More Button */}
            {useLoadMore && displayedProducts.length < sortedAndFilteredProducts.length && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setLoadedItemsCount(prev => prev + 10)}
                  className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Charger 10 produits supplémentaires
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {!useLoadMore && totalPages > 1 && (
              <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-4`}>
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                  {/* Page Info */}
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center lg:text-left`}>
                    Affichage de {startIndex + 1}-{Math.min(endIndex, sortedAndFilteredProducts.length)} sur {sortedAndFilteredProducts.length} produits
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
