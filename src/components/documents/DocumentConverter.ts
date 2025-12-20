/**
 * Document Converter Utility
 * 
 * This utility provides functions to convert data from existing components
 * to the new unified document format.
 */

import { DocumentData, DocumentItem } from './DocumentTypes';

/**
 * Convert a ticket to the unified document format
 */
export function convertTicketToDocument(ticket: any, clientId: string, client: any): DocumentData {
  // Ticket cost is VAT-inclusive, extract VAT from total
  const total = ticket.cost || 0; // This is already VAT-inclusive
  const taxRate = 0.20; // 20% VAT
  const taxAmount = total * (taxRate / (1 + taxRate)); // Extract VAT from inclusive total
  const subtotal = total - taxAmount; // Net amount (excluding VAT)

  // Create items from tasks
  const items: DocumentItem[] = [];
  
  if (ticket.taskPrices && Array.isArray(ticket.taskPrices)) {
    // If we have task prices, use them
    ticket.taskPrices.forEach((task: any) => {
      items.push({
        id: `task-${Math.random().toString(36).substring(2, 9)}`,
        name: task.name,
        quantity: 1,
        price: task.price
      });
    });
  } else if (ticket.tasks && Array.isArray(ticket.tasks)) {
    // Otherwise, distribute the cost evenly among tasks
    const taskCount = ticket.tasks.length;
    const pricePerTask = taskCount > 0 ? subtotal / taskCount : 0;
    
    ticket.tasks.forEach((task: string) => {
      items.push({
        id: `task-${Math.random().toString(36).substring(2, 9)}`,
        name: task,
        quantity: 1,
        price: pricePerTask
      });
    });
  }

  return {
    id: ticket.id || `ticket-${Math.random().toString(36).substring(2, 9)}`,
    number: ticket.ticketNumber || '',
    date: ticket.createdAt || new Date().toISOString(),
    customer: client ? {
      id: clientId,
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || ''
    } : undefined,
    items,
    subtotal,
    tax: taxAmount,
    total,
    status: ticket.status || 'Pending',
    type: 'ticket',
    deviceType: ticket.deviceType || '',
    brand: ticket.brand || '',
    model: ticket.model || '',
    passcode: ticket.passcode,
    sourceType: 'ticket',
    sourceId: ticket.id
  };
}

/**
 * Convert an invoice to the unified document format
 */
export function convertInvoiceToDocument(invoice: any): DocumentData {
  return {
    id: invoice.id || `invoice-${Math.random().toString(36).substring(2, 9)}`,
    number: invoice.invoiceNumber || '',
    date: invoice.date || new Date().toISOString(),
    customer: invoice.customer ? {
      id: invoice.customer.id || `customer-${Math.random().toString(36).substring(2, 9)}`,
      name: invoice.customer.name || '',
      email: invoice.customer.email || '',
      phone: invoice.customer.phone || '',
      address: invoice.customer.address || '',
      taxId: invoice.customer.taxId
    } : undefined,
    items: (invoice.items || []).map((item: any) => ({
      id: item.id || `item-${Math.random().toString(36).substring(2, 9)}`,
      name: item.name || '',
      quantity: item.quantity || 1,
      price: item.price || 0,
      sku: item.sku
    })),
    subtotal: invoice.subtotal || 0,
    tax: invoice.tax || 0,
    total: invoice.total || 0,
    paymentMethod: invoice.paymentMethod,
    paymentStatus: invoice.paymentStatus,
    amountPaid: invoice.amountPaid,
    note: invoice.note,
    type: 'invoice',
    sourceType: 'pos',
    sourceId: invoice.id
  };
}

/**
 * Convert a receipt to the unified document format
 */
export function convertReceiptToDocument(receipt: any): DocumentData {
  return {
    id: receipt.id || `receipt-${Math.random().toString(36).substring(2, 9)}`,
    number: receipt.receiptNumber || receipt.invoiceNumber || '',
    date: receipt.date || new Date().toISOString(),
    customer: receipt.customer ? {
      id: receipt.customer.id || `customer-${Math.random().toString(36).substring(2, 9)}`,
      name: receipt.customer.name || '',
      email: receipt.customer.email || '',
      phone: receipt.customer.phone || '',
      address: receipt.customer.address || ''
    } : undefined,
    items: (receipt.items || []).map((item: any) => ({
      id: item.id || `item-${Math.random().toString(36).substring(2, 9)}`,
      name: item.name || '',
      quantity: item.quantity || 1,
      price: item.price || 0
    })),
    subtotal: receipt.subtotal || 0,
    tax: receipt.tax || 0,
    total: receipt.total || 0,
    paymentMethod: receipt.paymentMethod,
    paymentStatus: receipt.paymentStatus || 'Paid',
    amountPaid: receipt.amountPaid,
    note: receipt.note,
    type: 'receipt',
    sourceType: 'pos',
    sourceId: receipt.id
  };
}
