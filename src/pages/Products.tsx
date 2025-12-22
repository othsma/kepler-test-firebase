import React, { useState } from 'react';
import { useThemeStore, useProductsStore } from '../lib/store';
import { Search, Plus, Edit2, Trash2, Package, ChevronDown, ChevronRight } from 'lucide-react';

export default function Products() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { products, categories, searchQuery, selectedCategory, setSearchQuery, setSelectedCategory, addProduct, updateProduct, deleteProduct } = useProductsStore();
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
  const [sortField, setSortField] = useState<'name' | 'price' | 'createdAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sorting functionality
  const sortedAndFilteredProducts = [...filteredProducts].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle different data types
    if (sortField === 'price') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    } else if (sortField === 'createdAt') {
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

  const handleSort = (field: 'name' | 'price' | 'createdAt') => {
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
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex items-center gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher des produits..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
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
                  onClick={() => handleSort('price')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    sortField === 'price'
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Prix {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
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

          {/* Product listing */}
          <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-8 text-center`}>
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit enregistré'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {searchQuery ? 'Essayez une recherche différente' : 'Commencez par créer votre premier produit'}
            </p>
          </div>
        ) : (
          sortedAndFilteredProducts.map((product) => {
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
          </div>
        </>
      )}
    </div>
  );
}
