import React, { useState, useEffect } from 'react';
import { useThemeStore, useProductsStore } from '../lib/store';
import { Search, Plus, Edit2, Trash2, Package, ChevronDown, ChevronRight, Tag, AlertTriangle, CheckCircle, XCircle, Minimize2, Expand, Filter } from 'lucide-react';

export default function Products() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { products, categories, selectedCategory, setSearchQuery, setSelectedCategory, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory, getCategoryUsage } = useProductsStore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'all' | 'categories'>('all');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [inlineEditData, setInlineEditData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    sku: '',
    description: '',
    imageUrl: '',
  });
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

  // Categories management state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categorySearch, setCategorySearch] = useState('');

  const filteredProducts = products.filter((product) => {
    const matchesSearch = localSearchQuery
      ? product.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        (product.category || '').toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        product.price.toString().includes(localSearchQuery)
      : true;
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

  // Enhanced keyboard shortcuts for products page
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Only handle shortcuts on the products page
      if (activeTab !== 'all') return;

      // Ctrl/Cmd key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'f':
            event.preventDefault();
            // Focus search input
            const searchInput = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
            break;
          case 'n':
            event.preventDefault();
            // Switch to create new product tab
            setActiveTab('main');
            break;
          case 'arrowleft':
            event.preventDefault();
            if (!useLoadMore && currentPage > 1) {
              setCurrentPage(prev => prev - 1);
            }
            break;
          case 'arrowright':
            event.preventDefault();
            if (!useLoadMore && currentPage < totalPages) {
              setCurrentPage(prev => prev + 1);
            }
            break;
          default:
            break;
        }
      } else {
        // Regular key shortcuts
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
          case 'Escape':
            event.preventDefault();
            // Close any open dropdowns
            setShowCategoryDropdown(false);
            setShowAdvancedFilters(false);
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
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Tag className="h-4 w-4" />
            Catégories ({categories.length})
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
          {/* Inventory Summary Dashboard */}
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6 mb-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              📊 État des stocks
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {products.filter(p => p.stock <= 0).length}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                  Rupture de stock
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'} border`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  {products.filter(p => p.stock > 0 && p.stock <= 5).length}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                  Stock critique (≤5)
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {products.filter(p => p.stock > 5 && p.stock <= 10).length}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                  Stock faible (6-10)
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {products.filter(p => p.stock > 10).length}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                    Stock normal (plus de 10)
                  </div>
              </div>
            </div>

            {/* Low Stock Alerts */}
            {products.filter(p => p.stock <= 5).length > 0 && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>
                  ⚠️ Alertes de stock faible
                </h4>
                <div className="flex flex-wrap gap-2">
                  {products.filter(p => p.stock <= 5).map(product => (
                    <span
                      key={product.id}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.name}: {product.stock} restant{product.stock !== 1 ? 's' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

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
                              <span className={`font-medium ${
                                product.stock <= 0 ? 'text-red-600' :
                                product.stock <= 5 ? 'text-red-500' :
                                product.stock <= 10 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                Stock: {product.stock}
                                {product.stock <= 0 && ' 🛑 RUPTURE'}
                                {product.stock > 0 && product.stock <= 5 && ' ⚠️ CRITIQUE'}
                                {product.stock > 5 && product.stock <= 10 && ' ⚠️ FAIBLE'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInlineEditData({
                                name: product.name,
                                category: product.category || '',
                                price: product.price.toString(),
                                stock: product.stock.toString(),
                                sku: product.sku,
                                description: product.description,
                                imageUrl: product.imageUrl,
                              });
                              setEditingProduct(product.id);
                              // Auto-expand if not already expanded
                              setExpandedProducts(prev => new Set([...prev, product.id]));
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
                          {editingProduct === product.id ? (
                            // Inline Editing Form
                            <div className="space-y-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  Modifier le produit
                                </h4>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingProduct(null);
                                      setInlineEditData({
                                        name: '',
                                        category: '',
                                        price: '',
                                        stock: '',
                                        sku: '',
                                        description: '',
                                        imageUrl: '',
                                      });
                                    }}
                                    className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateProduct(product.id, {
                                        name: inlineEditData.name,
                                        category: inlineEditData.category || undefined,
                                        price: Number(inlineEditData.price),
                                        stock: Number(inlineEditData.stock),
                                        sku: inlineEditData.sku,
                                        description: inlineEditData.description,
                                        imageUrl: inlineEditData.imageUrl,
                                      });
                                      setEditingProduct(null);
                                      setInlineEditData({
                                        name: '',
                                        category: '',
                                        price: '',
                                        stock: '',
                                        sku: '',
                                        description: '',
                                        imageUrl: '',
                                      });
                                    }}
                                    className="px-3 py-1 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                                  >
                                    Sauvegarder
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Nom
                                    </label>
                                    <input
                                      type="text"
                                      value={inlineEditData.name}
                                      onChange={(e) => setInlineEditData({ ...inlineEditData, name: e.target.value })}
                                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Catégorie
                                    </label>
                                    <select
                                      value={inlineEditData.category}
                                      onChange={(e) => setInlineEditData({ ...inlineEditData, category: e.target.value })}
                                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                                      }`}
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
                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Prix (€)
                                    </label>
                                    <input
                                      type="number"
                                      value={inlineEditData.price}
                                      onChange={(e) => setInlineEditData({ ...inlineEditData, price: e.target.value })}
                                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Stock
                                    </label>
                                    <input
                                      type="number"
                                      value={inlineEditData.stock}
                                      onChange={(e) => setInlineEditData({ ...inlineEditData, stock: e.target.value })}
                                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                                      }`}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      SKU
                                    </label>
                                    <input
                                      type="text"
                                      value={inlineEditData.sku}
                                      onChange={(e) => setInlineEditData({ ...inlineEditData, sku: e.target.value })}
                                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      URL de l'image
                                    </label>
                                    <input
                                      type="url"
                                      value={inlineEditData.imageUrl}
                                      onChange={(e) => setInlineEditData({ ...inlineEditData, imageUrl: e.target.value })}
                                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Description
                                    </label>
                                    <textarea
                                      value={inlineEditData.description}
                                      onChange={(e) => setInlineEditData({ ...inlineEditData, description: e.target.value })}
                                      rows={3}
                                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Display Mode
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
                                  <p className={`text-sm font-medium ${
                                    product.stock <= 0 ? 'text-red-600' :
                                    product.stock <= 5 ? 'text-red-500' :
                                    product.stock <= 10 ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                    {product.stock} unités
                                    {product.stock <= 0 && ' 🛑 RUPTURE DE STOCK'}
                                    {product.stock > 0 && product.stock <= 5 && ' ⚠️ STOCK CRITIQUE'}
                                    {product.stock > 5 && product.stock <= 10 && ' ⚠️ STOCK FAIBLE'}
                                    {product.stock > 10 && ' ✅ STOCK NORMAL'}
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
                          )}
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

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-indigo-600" />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Catégories
              </h2>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                ({categories.length} catégorie{categories.length > 1 ? 's' : ''})
              </span>
            </div>

            {/* Expand/Collapse Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const categoriesWithProducts = categories.filter(category =>
                    getCategoryUsage(category) > 0
                  );
                  const allExpanded = categoriesWithProducts.every(category => expandedCategories.has(category));

                  if (allExpanded) {
                    // Collapse all
                    setExpandedCategories(new Set());
                  } else {
                    // Expand all
                    setExpandedCategories(new Set(categoriesWithProducts));
                  }
                }}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
              >
                {(() => {
                  const categoriesWithProducts = categories.filter(category =>
                    getCategoryUsage(category) > 0
                  );
                  const allExpanded = categoriesWithProducts.every(category => expandedCategories.has(category));
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
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Rechercher des catégories ou produits..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {categories.filter(category =>
                    categorySearch === '' ||
                    category.toLowerCase().includes(categorySearch.toLowerCase()) ||
                    products.some(product =>
                      product.category === category &&
                      (product.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                       product.sku.toLowerCase().includes(categorySearch.toLowerCase()))
                    )
                  ).length} catégorie{categories.filter(category =>
                    categorySearch === '' ||
                    category.toLowerCase().includes(categorySearch.toLowerCase()) ||
                    products.some(product =>
                      product.category === category &&
                      (product.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                       product.sku.toLowerCase().includes(categorySearch.toLowerCase()))
                    )
                  ).length > 1 ? 's' : ''} visible{(() => {
                    const visibleCategories = categories.filter(category =>
                      categorySearch === '' ||
                      category.toLowerCase().includes(categorySearch.toLowerCase()) ||
                      products.some(product =>
                        product.category === category &&
                        (product.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                         product.sku.toLowerCase().includes(categorySearch.toLowerCase()))
                      )
                    );
                    return visibleCategories.length > 1 ? 's' : '';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Add New Category Section */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Ajouter une nouvelle catégorie</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newCategoryName.trim()) {
                  addCategory(newCategoryName.trim());
                  setNewCategoryName('');
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nom de la nouvelle catégorie..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
              <button
                type="submit"
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </form>
          </div>

          {/* Categories Grouped by Category */}
          <div className="space-y-4">
            {categories
              .filter(category =>
                categorySearch === '' ||
                category.toLowerCase().includes(categorySearch.toLowerCase()) ||
                products.some(product =>
                  product.category === category &&
                  (product.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                   product.sku.toLowerCase().includes(categorySearch.toLowerCase()))
                )
              )
              .map((category) => {
                const categoryProducts = products.filter(product =>
                  product.category === category &&
                  (categorySearch === '' ||
                   product.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                   product.sku.toLowerCase().includes(categorySearch.toLowerCase()) ||
                   category.toLowerCase().includes(categorySearch.toLowerCase()))
                );
                const usageCount = getCategoryUsage(category);
                const isExpanded = expandedCategories.has(category);
                const isEditing = editingCategory === category;

                return (
                  <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div
                      className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      onClick={() => {
                        if (isEditing) return; // Don't expand when editing
                        const newExpanded = new Set(expandedCategories);
                        if (isExpanded) {
                          newExpanded.delete(category);
                        } else {
                          newExpanded.add(category);
                        }
                        setExpandedCategories(newExpanded);
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
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              className="bg-transparent border border-indigo-300 rounded px-2 py-1 text-indigo-900 dark:text-indigo-100 focus:border-indigo-500 focus:outline-none"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                  if (editingCategoryName.trim() && editingCategoryName.trim() !== category) {
                                    updateCategory(category, editingCategoryName.trim());
                                  }
                                  setEditingCategory(null);
                                  setEditingCategoryName('');
                                } else if (e.key === 'Escape') {
                                  setEditingCategory(null);
                                  setEditingCategoryName('');
                                }
                              }}
                            />
                          ) : (
                            <h4 className="font-medium text-indigo-900 dark:text-indigo-100">{category}</h4>
                          )}
                          <span className="text-sm text-indigo-600 dark:text-indigo-400">
                            ({usageCount} produit{usageCount !== 1 ? 's' : ''})
                          </span>
                          {categorySearch && category.toLowerCase().includes(categorySearch.toLowerCase()) && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              Correspondance
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (editingCategoryName.trim() && editingCategoryName.trim() !== category) {
                                    updateCategory(category, editingCategoryName.trim());
                                  }
                                  setEditingCategory(null);
                                  setEditingCategoryName('');
                                }}
                                className="p-1 text-green-600 hover:text-green-900"
                                title="Sauvegarder"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCategory(null);
                                  setEditingCategoryName('');
                                }}
                                className="p-1 text-gray-600 hover:text-gray-900"
                                title="Annuler"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCategory(category);
                                  setEditingCategoryName(category);
                                }}
                                className="p-1 text-indigo-600 hover:text-indigo-900"
                                title="Modifier"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (usageCount > 0) {
                                    const confirmed = window.confirm(
                                      `Cette catégorie est utilisée par ${usageCount} produit(s). Voulez-vous vraiment la supprimer ? Les produits seront déplacés vers "Aucune catégorie".`
                                    );
                                    if (!confirmed) return;
                                  } else {
                                    const confirmed = window.confirm(
                                      `Êtes-vous sûr de vouloir supprimer la catégorie "${category}" ?`
                                    );
                                    if (!confirmed) return;
                                  }
                                  deleteCategory(category, usageCount > 0);
                                }}
                                className="p-1 text-red-600 hover:text-red-900"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="divide-y divide-gray-200 dark:divide-gray-600">
                        {categoryProducts.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Aucun produit dans cette catégorie</p>
                          </div>
                        ) : (
                          categoryProducts.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-center gap-3">
                                <Package className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {product.name}
                                    </span>
                                    {categorySearch && (
                                      product.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                                      product.sku.toLowerCase().includes(categorySearch.toLowerCase())
                                    ) && (
                                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                        Correspondance
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    SKU: {product.sku} • Stock: {product.stock} • Prix: €{product.price}
                                  </div>
                                </div>
                              </div>
                              <div className={`text-sm font-medium ${
                                product.stock <= 0 ? 'text-red-600' :
                                product.stock <= 5 ? 'text-red-500' :
                                product.stock <= 10 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {product.stock <= 0 && '🛑 RUPTURE'}
                                {product.stock > 0 && product.stock <= 5 && '⚠️ CRITIQUE'}
                                {product.stock > 5 && product.stock <= 10 && '⚠️ FAIBLE'}
                                {product.stock > 10 && '✅ NORMAL'}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Show categories without products */}
            {categories.filter(category => getCategoryUsage(category) === 0).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Catégories sans produits ({categories.filter(category => getCategoryUsage(category) === 0).length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {categories
                    .filter(category => getCategoryUsage(category) === 0)
                    .map((category) => (
                      <div key={category} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{category}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {categories.length === 0 && (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Aucune catégorie trouvée
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Commencez par créer votre première catégorie ci-dessus.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
