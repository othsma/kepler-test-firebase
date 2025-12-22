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

  // Calculate amount paid based on payment status
  let amountPaid = 0;
  if (ticket.paymentStatus === 'fully_paid') {
    amountPaid = total; // Full amount paid
  } else if (ticket.paymentStatus === 'partially_paid') {
    amountPaid = ticket.amountPaid || 0; // Partial amount paid
  }
  // For 'not_paid', amountPaid remains 0

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
    paymentStatus: ticket.paymentStatus || 'not_paid',
    amountPaid,
    status: ticket.status || 'Pending',
    type: 'ticket',
    deviceType: ticket.deviceType || '',
    brand: ticket.brand || '',
    model: ticket.model || '',
    imeiSerial: ticket.imeiSerial, // IMEI/Serial number for documents
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

/**
 * Convert a quote to the unified document format
 */
export function convertQuoteToDocument(quote: any): DocumentData {
  return {
    id: quote.id || `quote-${Math.random().toString(36).substring(2, 9)}`,
    number: quote.quoteNumber || '',
    date: quote.createdAt || new Date().toISOString(),
    customer: quote.customer ? {
      id: quote.customer.id || `customer-${Math.random().toString(36).substring(2, 9)}`,
      name: quote.customer.name || '',
      email: quote.customer.email || '',
      phone: quote.customer.phone || '',
      address: quote.customer.address || ''
    } : undefined,
    items: (quote.items || []).map((item: any) => ({
      id: item.productId || `item-${Math.random().toString(36).substring(2, 9)}`,
      name: item.name || '',
      quantity: item.quantity || 1,
      price: item.price || 0,
      sku: item.sku
    })),
    subtotal: quote.subtotal || 0,
    tax: quote.tax || 0,
    total: quote.total || 0,
    paymentMethod: quote.paymentMethod,
    note: quote.notes,
    type: 'quote',
    status: quote.status || 'draft',
    validUntil: quote.validUntil,
    sourceType: 'pos',
    sourceId: quote.id
  };
}

/**
 * Convert a ticket to an engagement contract document format
 */
export function convertEngagementToDocument(ticket: any, client: any): DocumentData {
  // Create items from ticket tasks (if available)
  const items: DocumentItem[] = [];

  if (ticket.taskPrices && Array.isArray(ticket.taskPrices)) {
    ticket.taskPrices.forEach((task: any) => {
      items.push({
        id: `task-${Math.random().toString(36).substring(2, 9)}`,
        name: task.name,
        quantity: 1,
        price: task.price
      });
    });
  } else if (ticket.tasks && Array.isArray(ticket.tasks)) {
    // For engagement contracts, we don't need pricing, just task names
    ticket.tasks.forEach((task: string) => {
      items.push({
        id: `task-${Math.random().toString(36).substring(2, 9)}`,
        name: task,
        quantity: 1,
        price: 0,
        description: 'Prestation de réparation'
      });
    });
  }

  return {
    id: ticket.id || `engagement-${Math.random().toString(36).substring(2, 9)}`,
    number: `ENG-${ticket.ticketNumber || Math.random().toString(36).substring(2, 9)}`,
    date: ticket.createdAt || new Date().toISOString(),
    customer: client ? {
      id: client.id || `customer-${Math.random().toString(36).substring(2, 9)}`,
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || ''
    } : undefined,
    items: items,
    subtotal: ticket.cost || 0,
    tax: 0, // Engagement contracts typically don't include tax breakdown
    total: ticket.cost || 0,
    status: ticket.status || 'pending',
    type: 'engagement',
    deviceType: ticket.deviceType || '',
    brand: ticket.brand || '',
    model: ticket.model || '',
    imeiSerial: ticket.imeiSerial, // IMEI/Serial number for documents
    sourceType: 'ticket',
    sourceId: ticket.id,

    // Engagement-specific fields (stored in note for now)
    note: `CONTRAT D'ENGAGEMENT CLIENT - ${ticket.ticketNumber}`
  };
}
