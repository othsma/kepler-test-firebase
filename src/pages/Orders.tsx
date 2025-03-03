import React, { useState } from 'react';
import { useThemeStore, useOrdersStore, useProductsStore, useClientsStore } from '../lib/store';
import { Search, Filter, Calendar, User, Package, DollarSign, ChevronDown, ChevronUp, Eye, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import ThermalReceipt from '../components/ThermalReceipt';

export default function Orders() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { orders, updateOrderStatus, createOrder } = useOrdersStore();
  const { products } = useProductsStore();
  const { clients } = useClientsStore();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // New order form state
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');
  const [orderItems, setOrderItems] = useState<Array<{productId: string; quantity: number}>>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');

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
    product.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Processing</span>;
      case 'ready_for_pickup':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Ready for Pickup</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Cancelled</span>;
      default:
        return null;
    }
  };

  const handleViewReceipt = (order: any) => {
    // Create a proper invoice object from the order
    const orderItems = order.items.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      return {
        id: item.productId,
        name: product?.name || 'Unknown Product',
        sku: product?.sku || 'N/A',
        quantity: item.quantity,
        price: product?.price || 0,
      };
    });

    const client = clients.find(c => c.id === order.clientId);
    
    const invoiceData = {
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
      paymentMethod: 'Card', // Default payment method
      paymentStatus: order.status === 'completed' ? 'Paid' : 'Pending',
    };
    
    setSelectedOrder(invoiceData);
    setShowReceipt(true);
  };

  const addItemToOrder = () => {
    if (!selectedProduct) return;
    
    const existingItemIndex = orderItems.findIndex(item => item.productId === selectedProduct);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += productQuantity;
      setOrderItems(updatedItems);
    } else {
      // Add new item
      setOrderItems([...orderItems, { productId: selectedProduct, quantity: productQuantity }]);
    }
    
    // Reset product selection
    setSelectedProduct('');
    setProductSearch('');
    setProductQuantity(1);
  };

  const removeItemFromOrder = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const calculateOrderTotal = () => {
    return orderItems.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleCreateOrder = async () => {
    if (!selectedClient || orderItems.length === 0) return;
    
    const total = calculateOrderTotal();
    await createOrder(selectedClient, total);
    
    // Reset form
    setSelectedClient('');
    setClientSearch('');
    setOrderItems([]);
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Orders
        </h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? 'Hide Form' : 'New Order'}
        </button>
      </div>

      {/* Collapsible Create Order Form */}
      {showCreateForm && (
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Create New Order
            </h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Client Selection */}
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
                  placeholder="Search for a client..."
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

            {/* Order Items */}
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Order Items *
              </label>
              
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setSelectedProduct('');
                    }}
                    placeholder="Search for a product..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  {productSearch && !selectedProduct && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedProduct(product.id);
                            setProductSearch(product.name);
                          }}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            ${product.price.toFixed(2)} - Stock: {product.stock}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <input
                  type="number"
                  min="1"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                  className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                
                <button
                  onClick={addItemToOrder}
                  disabled={!selectedProduct}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              
              {/* Order Items List */}
              {orderItems.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orderItems.map((item) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <tr key={item.productId}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product?.name || 'Unknown Product'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                              ${product?.price.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                              ${((product?.price || 0) * item.quantity).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-center">
                              <button
                                onClick={() => removeItemFromOrder(item.productId)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                          Subtotal:
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                          ${calculateOrderTotal().toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                          Tax (20%):
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                          ${(calculateOrderTotal() * 0.2).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                          Total:
                        </td>
                        <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                          ${(calculateOrderTotal() * 1.2).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 border rounded-md">
                  <ShoppingCart className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No items added to this order yet</p>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Credit Card</option>
                <option value="transfer">Bank Transfer</option>
                <option value="digital">Digital Payment</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={!selectedClient || orderItems.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow p-6`}>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex items-center gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Items
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
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
                  const itemCount = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                  
                  // Get product details for each item
                  const orderItems = order.items.map((item: any) => {
                    const product = products.find(p => p.id === item.productId);
                    return {
                      name: product?.name || 'Unknown Product',
                      quantity: item.quantity
                    };
                  });
                  
                  return (
                    <tr key={order.id} className={`hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{order.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {client?.name || 'Unknown Client'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-gray-400" />
                          {itemCount} items
                          <span className="ml-2 text-xs text-gray-400">
                            ({orderItems.map(item => `${item.quantity}x ${item.name}`).join(', ')})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                          ${order.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(order.id, e.target.value as any)
                          }
                          className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="ready_for_pickup">Ready for Pickup</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleViewReceipt(order)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Receipt"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReceipt && selectedOrder && (
        <ThermalReceipt
          invoice={selectedOrder}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}