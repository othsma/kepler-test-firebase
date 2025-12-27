import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../lib/store';
import { X, Plus, Minus, Trash2, Save } from 'lucide-react';

interface QuoteItem {
  productId: string;
  quantity: number;
  name: string;
  sku?: string;
  price: number;
  description?: string;
}

interface QuoteEditModalProps {
  quote: any;
  clients: any[];
  onClose: () => void;
  onSave: (updatedQuote: any) => void;
}

export default function QuoteEditModal({ quote, clients, onClose, onSave }: QuoteEditModalProps) {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const [editedQuote, setEditedQuote] = useState({...quote});
  const [selectedClientId, setSelectedClientId] = useState(quote.customer?.id || '');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [notes, setNotes] = useState(quote.notes || '');

  // Calculate totals when items change (prices are TTC - tax inclusive)
  const total = editedQuote.items?.reduce((sum: number, item: QuoteItem) => sum + (item.price * item.quantity), 0) || 0;
  const VAT_RATE = 0.20;
  const vatAmount = total * (VAT_RATE / (1 + VAT_RATE));
  const subtotal = total - vatAmount;

  // Update editedQuote when items change
  useEffect(() => {
    setEditedQuote(prev => ({
      ...prev,
      subtotal,
      tax: vatAmount,
      total
    }));
  }, [subtotal, vatAmount, total]);

  // Filtered clients based on search
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      // Remove item
      setEditedQuote(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    } else {
      // Update quantity
      setEditedQuote(prev => ({
        ...prev,
        items: prev.items.map((item, i) =>
          i === index ? { ...item, quantity } : item
        )
      }));
    }
  };

  const addNewItem = () => {
    const newItem = {
      productId: `custom-${Date.now()}`,
      quantity: 1,
      name: 'Nouvel article',
      price: 0,
      sku: 'CUSTOM'
    };

    setEditedQuote(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setEditedQuote(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItem = (index: number) => {
    setEditedQuote(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleClientSelect = (client: any) => {
    setSelectedClientId(client.id);
    setEditedQuote(prev => ({
      ...prev,
      customer: {
        id: client.id,
        name: client.name,
        ...(client.email && { email: client.email }),
        ...(client.phone && { phone: client.phone }),
        ...(client.address && { address: client.address }),
      }
    }));
    setClientSearch('');
    setShowClientDropdown(false);
  };

  const handleSave = () => {
    const finalQuote = {
      ...editedQuote,
      notes: notes.trim() || undefined
    };
    onSave(finalQuote);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Modifier le devis {quote.quoteNumber}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Client Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Client
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedClientId ? (clients.find(c => c.id === selectedClientId)?.name || clientSearch) : clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                  if (selectedClientId) {
                    setSelectedClientId('');
                  }
                }}
                onFocus={() => setShowClientDropdown(true)}
                onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                placeholder="Rechercher un client..."
                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
                }`}
              />
              {showClientDropdown && filteredClients.length > 0 && (
                <div className={`absolute z-10 w-full mt-1 rounded-md shadow-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } max-h-60 overflow-y-auto`}>
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                        selectedClientId === client.id ? 'bg-indigo-50 dark:bg-indigo-900' : ''
                      }`}
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Articles
              </label>
              <button
                onClick={addNewItem}
                className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {editedQuote.items?.map((item: QuoteItem, index: number) => (
                <div key={index} className={`flex items-center gap-4 p-4 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className={`w-full rounded border-gray-300 text-sm ${
                          isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Prix (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                        className={`w-full rounded border-gray-300 text-sm ${
                          isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Quantité</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateItemQuantity(index, item.quantity - 1)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                          className={`w-16 text-center rounded border-gray-300 text-sm ${
                            isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white'
                          }`}
                        />
                        <button
                          onClick={() => updateItemQuantity(index, item.quantity + 1)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          €{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Sous-total</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>TVA (20%)</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>€{vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300 dark:border-gray-600">
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'
              }`}
              placeholder="Ajouter des notes au devis..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 border rounded-md text-sm font-medium ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
