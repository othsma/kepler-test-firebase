import { useState } from 'react';
import { useThemeStore, useOrdersStore, useProductsStore, useClientsStore } from '../lib/store';
import { Search, ChevronDown, ChevronUp, Plus, Minus, Trash2, Edit, Printer, FileText } from 'lucide-react';
import { format } from 'date-fns';
import UnifiedDocument from '../components/documents/UnifiedDocument';
import { convertReceiptToDocument } from '../components/documents/DocumentConverter';

export default function Orders() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { orders, updateOrderStatus, createOrder, deleteOrder } = useOrdersStore();
  const { products } = useProductsStore();
  const { clients } = useClientsStore();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDocument, setShowDocument] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [documentFormat, setDocumentFormat] = useState<'thermal' | 'a4'>('thermal');
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  
  // New order form state
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');
  const [orderItems, setOrderItems] = useState<Array<{productId: string; quantity: number; name: string; description: string; price: number}>>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('not_paid');
  const [amountPaid, setAmountPaid] = useState(0);
  const [orderDate, setOrderDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [orderStatus, setOrderStatus] = useState<'pending' | 'processing' | 'ready_for_pickup' | 'completed' | 'cancelled'>('pending');
  const [orderNote, setOrderNote] = useState('');

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const client = clients.find((c) => c.id === order.clientId);
    const matchesSearch = searchQuery
      ? client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">En attente</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">En cours</span>;
      case 'ready_for_pickup':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Prêt à récupérer</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Terminé</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Annulé</span>;
      default:
        return null;
    }
  };

  const getPaymentStatusBadge = (status: string, paid: number, total: number) => {
    if (status === 'paid' || paid >= total) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Payé</span>;
    } else if (status === 'partially_paid' || (paid > 0 && paid < total)) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Partiellement payé</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Non payé</span>;
    }
  };

  const generateInvoiceData = (order: any) => {
    // Create a proper invoice object from the order
    const orderItems = order.items.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      return {
        id: item.productId,
        name: product?.name || item.name || 'Unknown Product',
        sku: product?.sku || 'N/A',
        quantity: item.quantity,
        price: item.price || product?.price || 0,
      };
    });

    const client = clients.find(c => c.id === order.clientId);
    
    return {
      invoiceNumber: `ORD-${order.id.substring(0, 8)}`,
      date: order.createdAt,
      customer: client ? {
        name: client.name,
        email: client.email,
        address: client.address,
        phone: client.phone,
      } : undefined,
      items: orderItems,
      subtotal: order.total / 1.2, // Assuming 20% VAT
      tax: order.total - (order.total / 1.2),
      total: order.total,
      paymentMethod: order.paymentMethod || 'Card', // Default payment method
      paymentStatus: order.paymentStatus || (order.status === 'completed' ? 'Paid' : 'Pending'),
      note: order.note,
      amountPaid: order.amountPaid || 0,
    };
  };

  const handleViewDocument = (order: any, format: 'thermal' | 'a4') => {
    const invoiceData = generateInvoiceData(order);
    setSelectedOrder(invoiceData);
    setDocumentFormat(format);
    setShowDocument(true);
  };

  const handleEditOrder = (order: any) => {
    setIsEditingOrder(true);
    setEditingOrderId(order.id);
    
    // Find the client
    const client = clients.find(c => c.id === order.clientId);
    setSelectedClient(order.clientId || '');
    setClientSearch(client?.name || '');
    
    // Set order items
    if (order.items && Array.isArray(order.items)) {
      const formattedItems = order.items.map((item: any) => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          quantity: item.quantity,
          name: product?.name || item.name || 'Unknown Product',
          description: item.description || product?.description || '',
          price: item.price || product?.price || 0
        };
      });
      setOrderItems(formattedItems);
    } else {
      setOrderItems([]);
    }
    
    // Set other order details
    setOrderDate(order.orderDate || format(new Date(order.createdAt), 'yyyy-MM-dd'));
    setDeliveryDate(order.deliveryDate || format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    setPaymentMethod(order.paymentMethod || 'cash');
    setPaymentStatus(order.paymentStatus || 'not_paid');
    setAmountPaid(order.amountPaid || 0);
    setOrderStatus(order.status || 'pending');
    setOrderNote(order.note || '');
    
    // Reset product selection
    setSelectedProduct('');
    setProductSearch('');
    setProductDescription('');
    setProductQuantity(1);
    setProductPrice(0);
  };

  const handleDeleteOrder = (order: any) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la commande #${order.id}?`)) {
      deleteOrder(order.id);
    }
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product.id);
    setProductSearch(product.name);
    setProductPrice(product.price);
    setProductDescription(product.description || '');
  };

  const addItemToOrder = () => {
    if (!productSearch) return;
    
    const newItem = {
      productId: selectedProduct || 'custom',
      name: productSearch,
      description: productDescription,
      quantity: productQuantity,
      price: productPrice
    };
    
    setOrderItems([...orderItems, newItem]);
    
    // Reset product selection
    setSelectedProduct('');
    setProductSearch('');
    setProductDescription('');
    setProductQuantity(1);
    setProductPrice(0);
  };

  const removeItemFromOrder = (index: number) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const newItems = [...orderItems];
    newItems[index].quantity = newQuantity;
    setOrderItems(newItems);
  };

  // VAT-inclusive pricing: entered amounts already include VAT
  const calculateGrandTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const calculateTax = () => {
    return calculateGrandTotal() * (0.2 / 1.2); // Extract VAT from inclusive total
  };

  const calculateOrderTotal = () => {
    return calculateGrandTotal() - calculateTax(); // Net amount (excluding VAT)
  };

  const calculateRemainingAmount = () => {
    return calculateGrandTotal() - amountPaid;
  };

  const handleCreateOrder = async () => {
    if (!selectedClient || orderItems.length === 0) return;
    
    const total = calculateGrandTotal();
    
    // Create order data object
    const orderData = {
      clientId: selectedClient,
      items: orderItems,
      total,
      status: orderStatus,
      paymentMethod,
      paymentStatus,
      amountPaid,
      orderDate,
      deliveryDate,
      note: orderNote
    };
    
    if (isEditingOrder && editingOrderId) {
      // Update existing order
      await updateOrderStatus(editingOrderId, orderStatus);
      // In a real app, you would update all order details here
      console.log('Updating order:', editingOrderId, orderData);
    } else {
      // Create new order
      await createOrder(selectedClient, total);
      console.log('Creating order:', orderData);
    }
    
    // Reset form
    resetOrderForm();
  };

  const resetOrderForm = () => {
    setSelectedClient('');
    setClientSearch('');
    setOrderItems([]);
    setOrderDate(format(new Date(), 'yyyy-MM-dd'));
    setDeliveryDate(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    setPaymentStatus('not_paid');
    setAmountPaid(0);
    setOrderStatus('pending');
    setOrderNote('');
    setIsEditingOrder(false);
    setEditingOrderId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Gestion des commandes
        </h1>
      </div>

      {/* New Order Form */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {isEditingOrder ? 'Modifier la commande' : 'Nouvelle commande'}
          </h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showCreateForm ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
        
        {showCreateForm && (
          <div className="p-6">
            <h3 className={`text-md font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Détails de la commande
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Client *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setSelectedClient('');
                    }}
                    placeholder="Rechercher un client..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
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
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Date de commande *
                </label>
                <div className="flex items-center">
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Date de livraison *
                </label>
                <div className="flex items-center">
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Statut de la commande *
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value as 'pending' | 'processing' | 'ready_for_pickup' | 'completed' | 'cancelled')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="pending">En attente</option>
                  <option value="processing">En cours</option>
                  <option value="ready_for_pickup">Prêt à récupérer</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Statut du paiement *
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="not_paid">Non payé</option>
                  <option value="partially_paid">Partiellement payé</option>
                  <option value="paid">Payé</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Mode de paiement *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="cash">Espèces</option>
                  <option value="card">Carte bancaire</option>
                  <option value="transfer">Virement</option>
                  <option value="digital">Paiement numérique</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Montant payé
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">€</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="pl-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Note (optionnel)
                </label>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={2}
                />
              </div>
            </div>

            <h3 className={`text-md font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Articles de la commande
            </h3>

            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Produit *
                  </label>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setSelectedProduct('');
                    }}
                    placeholder="Rechercher un produit..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  {productSearch && !selectedProduct && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectProduct(product)}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">€{product.price} - Stock: {product.stock}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Description du produit..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Quantité *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Prix *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">€</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productPrice}
                        onChange={(e) => setProductPrice(parseFloat(e.target.value) || 0)}
                        className="pl-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={addItemToOrder}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-1"
                  disabled={!productSearch || productPrice <= 0}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un article
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Article
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Prix unitaire
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total ligne
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {orderItems.length > 0 ? (
                    orderItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => updateItemQuantity(index, item.quantity - 1)}
                              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="mx-2">{item.quantity}</span>
                            <button
                              onClick={() => updateItemQuantity(index, item.quantity + 1)}
                              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                          €{item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                          €{(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button
                            onClick={() => removeItemFromOrder(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        Aucun article ajouté à cette commande pour le moment. Utilisez le formulaire ci-dessus pour ajouter des articles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Total HT:</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    €{calculateOrderTotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>TVA (20%):</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    €{calculateTax().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 font-bold">
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total TTC:</span>
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    €{calculateGrandTotal().toFixed(2)}
                  </span>
                </div>
                {amountPaid > 0 && (
                  <>
                    <div className="flex justify-between py-2">
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Montant payé:</span>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        €{amountPaid.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 font-bold">
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Restant:</span>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        €{calculateRemainingAmount().toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={resetOrderForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={!selectedClient || orderItems.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isEditingOrder ? 'Mettre à jour la commande' : 'Enregistrer la commande'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* All Orders Table */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Toutes les commandes
          </h2>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher des commandes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="processing">En cours</option>
              <option value="ready_for_pickup">Prêt à récupérer</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  N° commande
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Paiement
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const client = clients.find((c) => c.id === order.clientId);
                  return (
                    <tr key={order.id} className={`hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{order.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {client?.name || 'Client inconnu'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {format(new Date(order.createdAt), 'MM/dd/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentStatusBadge(
                          order.paymentStatus || 'not_paid', 
                          order.amountPaid || 0, 
                          order.total
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {order.paymentMethod || 'Espèces'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        €{order.total.toFixed(2)}
                        {(order.amountPaid || 0) > 0 && (order.amountPaid || 0) < order.total && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Payé: €{(order.amountPaid || 0).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-3">
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleViewDocument(order, 'thermal')}
                            className="text-green-600 hover:text-green-900"
                            title="Print Receipt"
                          >
                            <Printer className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleViewDocument(order, 'a4')}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="A4 Invoice"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Aucune commande trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Modal */}
      {showDocument && selectedOrder && (
        <UnifiedDocument
          data={convertReceiptToDocument(selectedOrder)}
          onClose={() => setShowDocument(false)}
          initialFormat={documentFormat}
        />
      )}
    </div>
  );
}
