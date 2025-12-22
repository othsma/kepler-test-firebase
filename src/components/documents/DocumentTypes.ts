/**
 * Shared type definitions for the unified document system
 * This file contains interfaces used across all document components
 */

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  sku?: string;
  description?: string;
}

export interface DocumentData {
  id: string;
  number: string;
  date: string;
  customer?: Customer;
  items: DocumentItem[];
  subtotal: number;
  tax: number;
  total: number;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  amountPaid?: number;
  note?: string;
  type: 'receipt' | 'invoice' | 'ticket' | 'quote' | 'engagement';

  // Additional fields for tickets
  deviceType?: string;
  brand?: string;
  model?: string;
  passcode?: string;

  // Additional fields for quotes
  validUntil?: string;

  // Source information
  sourceType?: 'pos' | 'ticket';
  sourceId?: string;
}

export type DocumentFormat = 'thermal' | 'a4' | 'pdf';

export interface DocumentAction {
  icon: any; // Will be a Lucide icon component
  label: string;
  onClick: () => void;
  disabled?: boolean;
}
