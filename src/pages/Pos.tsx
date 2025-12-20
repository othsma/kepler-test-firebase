import React, { useState, useEffect, useMemo } from 'react';
import { useThemeStore, useProductsStore, useClientsStore, useTicketsStore, useOrdersStore, useSalesStore, usePosStore } from '../lib/store';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, FileText, Printer, X, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import UnifiedDocument from '../components/documents/UnifiedDocument';
import { convertReceiptToDocument } from '../components/documents/DocumentConverter';

// Payment methods
const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: Banknote },
  { id: 'card', name: 'Credit Card', icon: CreditCard },
  { id: 'transfer', name: 'Bank Transfer', icon: FileText },
  { id: 'digital', name: 'Digital Payment', icon: Smartphone },
];

export default function Pos() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { products, categories, searchQuery, selectedCategory, setSearchQuery, setSelectedCategory } = useProductsStore();
  const { clients } = useClientsStore();
  const { tickets } = useTicketsStore();
  const { createOrder } = useOrdersStore();
  const { createSale } = useSalesStore();
  const { showReceipt, currentInvoice, setShowReceipt, setCurrentInvoice, clearReceipt } = usePosStore();
  
  // Cart state
  const [cart, setCart] = useState<Array<{ product: any; quantity: number }>>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [invoiceId, setInvoiceId] = useState('');
  const [note, setNote] = useState('');
  const [quickSale, setQuickSale] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState<'thermal' | 'a4'>('thermal');
  const [currentView, setCurrentView] = useState<'pos' | 'sales'>('pos');

  // Sales table state
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = newest first
  
  // Filtered products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery 
      ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Filtered clients based on search
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone.toLowerCase().includes(clientSearch.toLowerCase())
  );
  
  // Filtered tickets based on search and selected client
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticketSearch 
      ? ticket.ticketNumber.toLowerCase().includes(ticketSearch.toLowerCase())
      : true;
    const matchesClient = selectedClient 
      ? ticket.clientId === selectedClient
      : true;
    return matchesSearch && matchesClient;
  });
  
  // Calculate cart totals
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const VAT_RATE = 0.20; // 20% VAT
  const vatAmount = subtotal * VAT_RATE;
  const total = subtotal + vatAmount;
  
  // Add product to cart
  const addToCart = (product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };
  
  // Update cart item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    } else {
      setCart(prevCart => 
        prevCart.map(item => 
          item.product.id === productId 
            ? { ...item, quantity } 
            : item
        )
      );
    }
  };
  
  // Clear cart
  const clearCart = () => {
    setCart([]);
    setSelectedClient(null);
    setSelectedTicket(null);
    setClientSearch('');
    setTicketSearch('');
    setPaymentMethod(PAYMENT_METHODS[0].id);
    setNote('');
    setQuickSale(false);
    setReceiptFormat('thermal');
  };
  
  // Generate invoice ID
  const generateInvoiceId = () => {
    const prefix = 'INV';
    const date = format(new Date(), 'yyMMdd');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${date}-${random}`;
  };
  
  // Create invoice
  const createInvoice = async () => {
    if (cart.length === 0) return;

    // In a real app, you would save this to a database
    const newInvoiceId = generateInvoiceId();
    setInvoiceId(newInvoiceId);

    const client = selectedClient ? clients.find(c => c.id === selectedClient) : undefined;

    const invoiceData = {
      invoiceNumber: newInvoiceId,
      date: new Date().toISOString(),
      customer: client ? {
        name: client.name,
        email: client.email,
        address: client.address,
        phone: client.phone,
        taxId: '', // In a real app, you might have this information
      } : undefined,
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        price: item.product.price,
      })),
      subtotal,
      tax: vatAmount,
      total,
      paymentMethod: PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name || paymentMethod,
      paymentStatus: 'Paid',
      note: note || undefined,
    };

    // Ensure note is always a string (safeguard against undefined)
    const safeNote = note ?? '';
    const currentNote = safeNote || '';

    // Save the sale locally
    const saleData: any = {
      invoiceNumber: newInvoiceId,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        name: item.product.name,
        sku: item.product.sku,
        price: item.product.price,
      })),
      subtotal,
      tax: vatAmount,
      total,
      customer: client ? {
        id: client.id,
        name: client.name,
        ...(client.email && { email: client.email }),
        ...(client.phone && { phone: client.phone }),
        ...(client.address && { address: client.address }),
      } : undefined,
      paymentMethod: PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name || paymentMethod,
      paymentStatus: 'Paid',
      date: new Date().toISOString(),
    };

    // Only include note if it has a value (strict check)
    if (typeof currentNote === 'string' && currentNote.trim().length > 0) {
      saleData.note = currentNote.trim();
    }

    const saleId = await createSale(saleData);
    console.log('Sale saved to Firebase with ID:', saleId);

    // Show the receipt
    console.log('Before setCurrentInvoice');
    setCurrentInvoice(invoiceData);
    console.log('Before setShowReceipt');
    setShowReceipt(true);
    console.log('After setShowReceipt');

    // Save to localStorage immediately to prevent loss on remount
    localStorage.setItem('pos_showReceipt', 'true');
    localStorage.setItem('pos_currentInvoice', JSON.stringify(invoiceData));

    console.log('Sale completed:', {
      saleId,
      invoiceId: newInvoiceId,
      items: cart,
      client: selectedClient ? clients.find(c => c.id === selectedClient) : null,
      ticket: selectedTicket ? tickets.find(t => t.id === selectedTicket) : null,
      subtotal,
      vat: vatAmount,
      total,
      paymentMethod,
      date: new Date().toISOString(),
      note
    });
  };

  console.log('Pos component rendering, showReceipt:', showReceipt, 'currentInvoice:', !!currentInvoice);

  // Get sales data for the sales view
  const { sales, fetchSales } = useSalesStore();

  // Load sales on component mount
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Filtered and sorted sales for the table
  const filteredAndSortedSales = useMemo(() => {
    let filtered = sales.filter((sale) => {
      // Keyword search
      const matchesKeyword = salesSearchQuery
        ? sale.invoiceNumber.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
          (sale.customer?.name || '').toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
          (sale.note || '').toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
          sale.paymentMethod.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
          sale.items.some(item =>
            item.name.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
            (item.sku || '').toLowerCase().includes(salesSearchQuery.toLowerCase())
          )
        : true;

      // Date filtering
      const saleDate = new Date(sale.date);
      const matchesDateFrom = dateFrom ? saleDate >= new Date(dateFrom) : true;
      const matchesDateTo = dateTo ? saleDate <= new Date(dateTo + 'T23:59:59') : true;

      return matchesKeyword && matchesDateFrom && matchesDateTo;
    });

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [sales, salesSearchQuery, dateFrom, dateTo, sortOrder]);

  // Clear filters function
  const clearFilters = () => {
    setSalesSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setSortOrder('desc');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Point of Sale
        </h1>
      </div>

      {/* Receipt Modal - Always available regardless of current view */}
      {showReceipt && currentInvoice && (
        <UnifiedDocument
          data={convertReceiptToDocument(currentInvoice)}
          onClose={() => {
            clearReceipt();
            localStorage.removeItem('pos_showReceipt');
            localStorage.removeItem('pos_currentInvoice');
            clearCart();
          }}
          initialFormat={receiptFormat}
        />
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setCurrentView('pos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'pos'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            POS System
          </button>
          <button
            onClick={() => setCurrentView('sales')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'sales'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Sales
          </button>
        </nav>
      </div>

      {currentView === 'sales' ? (
        /* Sales Table View */
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              All Sales ({filteredAndSortedSales.length})
            </h2>
            <button
              onClick={() => fetchSales()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Refresh
            </button>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 space-y-4">
            {/* Search and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className={`flex items-center gap-2 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <Search className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by invoice, customer, product, payment method..."
                    value={salesSearchQuery}
                    onChange={(e) => setSalesSearchQuery(e.target.value)}
                    className={`flex-1 bg-transparent border-0 focus:ring-0 ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {sortOrder === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                  Date {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </button>

                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Date Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  From:
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  To:
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
            </div>
          </div>

          {filteredAndSortedSales.length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {sales.length === 0 ? 'No sales found.' : 'No sales match your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Invoice
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Customer
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Items
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Payment
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Total
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                  {filteredAndSortedSales.map((sale) => (
                    <tr key={sale.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {sale.invoiceNumber}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {format(new Date(sale.date), 'MMM dd, yyyy')}
                        <br />
                        <span className="text-xs">{format(new Date(sale.date), 'HH:mm')}</span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {sale.customer?.name || 'Walk-in Customer'}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        <div className="max-w-xs truncate">
                          {sale.items.length} item(s)
                          {sale.items.length > 0 && (
                            <div className="text-xs mt-1">
                              {sale.items.slice(0, 2).map((item, idx) => (
                                <span key={idx}>
                                  {item.name}{idx < sale.items.slice(0, 2).length - 1 ? ', ' : ''}
                                </span>
                              ))}
                              {sale.items.length > 2 && '...'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {sale.paymentMethod}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        €{sale.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            // Show receipt for this sale
                            setCurrentInvoice({
                              invoiceNumber: sale.invoiceNumber,
                              date: sale.date,
                              customer: sale.customer,
                              items: sale.items.map(item => ({
                                id: item.productId,
                                name: item.name,
                                sku: item.sku,
                                quantity: item.quantity,
                                price: item.price,
                              })),
                              subtotal: sale.subtotal,
                              tax: sale.tax,
                              total: sale.total,
                              paymentMethod: sale.paymentMethod,
                              paymentStatus: sale.paymentStatus,
                              note: sale.note,
                              type: 'receipt'
                            });
                            setShowReceipt(true);
                          }}
                          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Catalog */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 flex items-center gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
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
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="h-32 bg-gray-100 flex items-center justify-center">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full object-contain"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.name}
                    </h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        €{product.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700"
                        disabled={product.stock <= 0}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Stock: {product.stock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No products found. Try a different search or category.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Cart and Checkout */}
        <div className="space-y-6">
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <ShoppingCart className="h-5 w-5 inline mr-2" />
                Cart
              </h2>
              <button
                onClick={clearCart}
                className="text-gray-400 hover:text-gray-500"
                disabled={cart.length === 0}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your cart is empty
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex-1">
                      <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.product.name}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        €{item.product.price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Subtotal</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  €{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>VAT (20%)</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  €{vatAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  €{total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Checkout
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="quickSale"
                  checked={quickSale}
                  onChange={(e) => {
                    setQuickSale(e.target.checked);
                    if (e.target.checked) {
                      setSelectedClient(null);
                      setClientSearch('');
                    }
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="quickSale" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quick Sale (No Client Info)
                </label>
              </div>
              
              {!quickSale && (
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Client
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setSelectedClient(null);
                      }}
                      placeholder="Search for a client..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {clientSearch && !selectedClient && filteredClients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedClient(client.id);
                              setClientSearch(client.name);
                            }}
                          >
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedClient && (
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Link to Repair Ticket (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={ticketSearch}
                      onChange={(e) => {
                        setTicketSearch(e.target.value);
                        setSelectedTicket(null);
                      }}
                      placeholder="Search for a ticket..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {ticketSearch && !selectedTicket && filteredTickets.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedTicket(ticket.id);
                              setTicketSearch(ticket.ticketNumber);
                            }}
                          >
                            <div className="font-medium">#{ticket.ticketNumber}</div>
                            <div className="text-sm text-gray-500">
                              {ticket.deviceType} - {ticket.brand}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Receipt Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReceiptFormat('thermal')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-md ${
                      receiptFormat === 'thermal'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Printer className="h-5 w-5" />
                    <span className="text-sm">Thermal Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptFormat('a4')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-md ${
                      receiptFormat === 'a4'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-sm">A4 Invoice</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-md ${
                        paymentMethod === method.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <method.icon className="h-5 w-5" />
                      {method.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Add a note to this sale..."
                />
              </div>
              
              <button
                onClick={createInvoice}
                disabled={cart.length === 0 || (!quickSale && !selectedClient)}
                className="w-full bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-5 w-5" />
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
