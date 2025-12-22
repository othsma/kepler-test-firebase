import { useState, useEffect, useMemo, useRef } from 'react';
import { useThemeStore, useProductsStore, useClientsStore, useTicketsStore, useSalesStore, usePosStore } from '../lib/store';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Receipt, FileText, Printer, ArrowRight, ArrowUp, ArrowDown, Calendar, Zap, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';
import UnifiedDocument from '../components/documents/UnifiedDocument';
import { convertReceiptToDocument } from '../components/documents/DocumentConverter';

// Payment methods
const PAYMENT_METHODS = [
  { id: 'cash', name: 'Espèces', icon: Banknote },
  { id: 'card', name: 'Carte bancaire', icon: CreditCard },
  { id: 'transfer', name: 'Virement', icon: FileText },
  { id: 'digital', name: 'Chèque', icon: Receipt },
];

export default function Pos() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { products, categories, updateStock } = useProductsStore();
  const { clients } = useClientsStore();
  const { tickets } = useTicketsStore();
  const { createSale } = useSalesStore();
  const { showReceipt, currentInvoice, setShowReceipt, setCurrentInvoice, clearReceipt } = usePosStore();

  // Cart state
  const [cart, setCart] = useState<Array<{ product: any; quantity: number }>>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [note, setNote] = useState('');
  const [quickSale, setQuickSale] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState<'thermal' | 'a4'>('thermal');
  const [currentView, setCurrentView] = useState<'pos' | 'sales'>('pos');

  // Sales table state
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = newest first

  // Local search state - independent of store
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Multi-category selection state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockRange, setStockRange] = useState({ min: '', max: '' });
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Filtered products based on search, categories, and advanced filters
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

  // Virtual scrolling setup for product catalog
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredProducts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220, // Estimated height of each product card
    overscan: 5, // Render 5 extra items outside visible area for smoother scrolling
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
  
  // Calculate cart totals (VAT-inclusive pricing)
  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const VAT_RATE = 0.20; // 20% VAT
  const vatAmount = total * (VAT_RATE / (1 + VAT_RATE)); // Extract VAT from inclusive total
  const subtotal = total - vatAmount; // Net amount (excluding VAT)
  
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
    setClientDropdownOpen(false);
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

    const client = selectedClient ? clients.find(c => c.id === selectedClient) : undefined;

    // Validate that if a client is selected, it exists
    if (selectedClient && !client) {
      alert('Erreur: Client sélectionné introuvable. Veuillez réessayer.');
      return;
    }

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

    if (!saleId) {
      alert('Erreur: Impossible de créer la vente. Veuillez réessayer.');
      return;
    }

    // Update inventory stock levels
    try {
      for (const item of cart) {
        await updateStock(item.product.id, -item.quantity);
      }
    } catch (stockError) {
      console.error('Error updating stock:', stockError);
      // Don't fail the entire sale if stock update fails, but log it
      alert('Vente créée avec succès, mais erreur lors de la mise à jour du stock. Veuillez vérifier manuellement.');
    }

    // Show the receipt
    setCurrentInvoice(invoiceData);
    setShowReceipt(true);

    // Save to localStorage immediately to prevent loss on remount
    localStorage.setItem('pos_showReceipt', 'true');
    localStorage.setItem('pos_currentInvoice', JSON.stringify(invoiceData));
  };

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

  // Keyboard shortcuts for POS operations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when POS tab is active and not in input fields
      if (currentView !== 'pos' || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'f1':
          event.preventDefault();
          setPaymentMethod('cash');
          break;
        case 'f2':
          event.preventDefault();
          setPaymentMethod('card');
          break;
        case 'f3':
          event.preventDefault();
          setPaymentMethod('transfer');
          break;
        case 'f4':
          event.preventDefault();
          setPaymentMethod('digital');
          break;
        case 'f5':
          event.preventDefault();
          setReceiptFormat('thermal');
          break;
        case 'f6':
          event.preventDefault();
          setReceiptFormat('a4');
          break;
        case 'f7':
          event.preventDefault();
          setQuickSale(!quickSale);
          break;
        case 'f9':
          event.preventDefault();
          if (cart.length > 0 && (quickSale || selectedClient)) {
            createInvoice();
          }
          break;
        case 'f10':
          event.preventDefault();
          clearCart();
          break;
        case 'escape':
          event.preventDefault();
          setCurrentView('sales');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, cart.length, quickSale, selectedClient, paymentMethod, receiptFormat]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Caisse
        </h1>
        <div className="flex items-center gap-2">
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} hidden sm:block`}>
            Raccourcis: F1-F4 (Paiement) | F5-F6 (Reçu) | F7 (Vente Rapide) | F9 (Finaliser) | F10 (Vider)
          </div>
          <button
            onClick={() => setCurrentView(currentView === 'pos' ? 'sales' : 'pos')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {currentView === 'pos' ? '📊 Ventes' : '🛒 PDV'}
          </button>
        </div>
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
            Système PDV
          </button>
          <button
            onClick={() => setCurrentView('sales')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'sales'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Toutes les ventes
          </button>
        </nav>
      </div>

      {currentView === 'sales' ? (
        /* Sales Table View */
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Toutes les ventes ({filteredAndSortedSales.length})
            </h2>
            <button
              onClick={() => fetchSales()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Actualiser
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
                    placeholder="Rechercher par facture, client, produit, mode de paiement..."
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
                  Date {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
                </button>

                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Effacer les filtres
                </button>
              </div>
            </div>

            {/* Date Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  De:
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
                  À:
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
                {sales.length === 0 ? 'Aucune vente trouvée.' : 'Aucune vente ne correspond à vos filtres.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Facture
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Client
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Articles
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Statut
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
                        {sale.customer?.name || 'Client sans rendez-vous'}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        <div className="max-w-xs truncate">
                          {sale.items.length} article(s)
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
                        {sale.paymentStatus === 'Paid' ? 'Payé' : sale.paymentStatus || 'Non payé'}
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
                          Facture
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Catalog */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 flex items-center gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher des produits..."
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>

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
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 whitespace-nowrap"
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>

              {/* Category Filter */}
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
                      : `${selectedCategories.length} cat. sélectionnée${selectedCategories.length > 1 ? 's' : ''}`
                    }
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
                </button>

                {showCategoryDropdown && (
                  <div className="relative">
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
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center justify-between border-t pt-4 border-gray-200 dark:border-gray-700">
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

            {/* Quick Add - Top Selling Products */}
            {sales.length > 0 && (
              <div className="mb-4">
                <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  🔥 Produits populaires
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {(() => {
                    // Calculate top-selling products from sales data
                    const productSales = new Map();
                    sales.forEach(sale => {
                      sale.items.forEach(item => {
                        const current = productSales.get(item.productId) || { count: 0, name: item.name, price: item.price };
                        productSales.set(item.productId, {
                          ...current,
                          count: current.count + item.quantity
                        });
                      });
                    });

                    const topProducts = Array.from(productSales.entries())
                      .sort(([,a], [,b]) => b.count - a.count)
                      .slice(0, 8)
                      .map(([productId, data]) => ({
                        id: productId,
                        ...data,
                        product: products.find(p => p.id === productId)
                      }))
                      .filter(item => item.product); // Only include products that still exist

                    return topProducts.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => addToCart(item.product)}
                        disabled={item.product.stock <= 0}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg border text-left transition-colors ${
                          item.product.stock <= 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium truncate max-w-24">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          €{item.price.toFixed(2)}
                        </div>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}

            <div className="min-h-[600px] max-h-[800px] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                      isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    } ${product.stock <= 0 ? 'opacity-60' : ''}`}
                  >
                    <div className="h-40 bg-gray-50 dark:bg-gray-700 flex items-center justify-center relative">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-contain p-4"
                        loading="lazy"
                      />
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">RUPTURE DE STOCK</span>
                        </div>
                      )}
                      {product.stock > 0 && product.stock <= 5 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          STOCK CRITIQUE
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className={`font-semibold text-sm leading-tight mb-2 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {product.name}
                      </h3>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col">
                          <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            €{product.price.toFixed(2)}
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {product.category || 'Sans catégorie'}
                          </span>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          className={`p-3 rounded-full transition-colors ${
                            product.stock <= 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                          }`}
                          title={product.stock <= 0 ? 'Produit indisponible' : 'Ajouter au panier'}
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>

                      <div className={`text-xs font-medium ${
                        product.stock <= 0 ? 'text-red-600' :
                        product.stock <= 5 ? 'text-red-500' :
                        product.stock <= 10 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {product.stock <= 0 ? '🚫 Indisponible' :
                         product.stock <= 5 ? `⚠️ ${product.stock} en stock` :
                         product.stock <= 10 ? `⚠️ ${product.stock} en stock` :
                         `✅ ${product.stock} en stock`}
                      </div>

                      {product.stock > 0 && product.stock <= 10 && (
                        <div className="mt-2 text-xs text-orange-600 font-medium">
                          ⚠️ Stock faible - réapprovisionner bientôt
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Aucun produit trouvé. Essayez une recherche ou une catégorie différente.
                </p>
              </div>
            )}
          </div>

          {/* Cart and Checkout */}
          <div className="space-y-6">
            <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <ShoppingCart className="h-5 w-5 inline mr-2" />
                  Panier
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
                    Votre panier est vide
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
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Sous-total</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    €{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>TVA (20%)</span>
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
                Paiement
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
                    Vente rapide (sans info client)
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
                        value={selectedClient ? (clients.find(c => c.id === selectedClient)?.name || clientSearch) : clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setClientDropdownOpen(true);
                          if (selectedClient) {
                            setSelectedClient(null);
                          }
                        }}
                        onFocus={() => {
                          setClientDropdownOpen(true);
                        }}
                        onBlur={() => {
                          // Delay hiding dropdown to allow for clicks
                          setTimeout(() => setClientDropdownOpen(false), 200);
                        }}
                        placeholder="Rechercher un client..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {clientDropdownOpen && filteredClients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredClients.map((client) => (
                            <div
                              key={client.id}
                              className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${selectedClient === client.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                              onClick={() => {
                                setSelectedClient(client.id);
                                setClientSearch('');
                                setClientDropdownOpen(false);
                              }}
                            >
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-gray-500">{client.phone}</div>
                              {selectedClient === client.id && (
                                <div className="text-xs text-indigo-600 font-medium">Sélectionné</div>
                              )}
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
                      Lier à un ticket de réparation (optionnel)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={ticketSearch}
                        onChange={(e) => {
                          setTicketSearch(e.target.value);
                          setSelectedTicket(null);
                        }}
                        placeholder="Rechercher un ticket..."
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
                    Format du reçu
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
                      <span className="text-sm">Reçu thermique</span>
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
                      <span className="text-sm">Facture A4</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Mode de paiement
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
                    placeholder="Ajouter une note à cette vente..."
                  />
                </div>

                <button
                  onClick={createInvoice}
                  disabled={cart.length === 0 || (!quickSale && !selectedClient)}
                  className="w-full bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowRight className="h-5 w-5" />
                  Finaliser la vente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
