/**
 * Document Configuration
 *
 * Configuration-driven approach for document formats.
 * Centralizes styling, layout, and format-specific settings.
 */

import { DocumentFormat, DocumentData } from './DocumentTypes';

export interface FormatConfig {
  name: string;
  width: string;
  height?: string;
  styles: {
    container: string;
    header: string;
    body: string;
    footer: string;
  };
  showLogo: boolean;
  showTerms: boolean;
  showQRCode: boolean;
  layout: 'compact' | 'spacious';
}

export interface ActionConfig {
  icon: any;
  label: string;
  enabled: boolean;
  primary?: boolean;
}

// Format configurations
export const FORMAT_CONFIGS: Record<DocumentFormat, FormatConfig> = {
  thermal: {
    name: 'Thermal Receipt',
    width: '80mm',
    styles: {
      container: 'p-4 bg-white text-black',
      header: 'text-center mb-4',
      body: 'space-y-2',
      footer: 'text-center text-xs mt-4 border-t border-dashed pt-2'
    },
    showLogo: true,
    showTerms: false,
    showQRCode: false,
    layout: 'compact'
  },
  a4: {
    name: 'A4 Format',
    width: '210mm',
    height: '297mm',
    styles: {
      container: 'p-8 bg-white text-black',
      header: 'mb-8',
      body: 'space-y-6',
      footer: 'text-center text-sm text-gray-600 border-t border-gray-300 pt-4'
    },
    showLogo: true,
    showTerms: true,
    showQRCode: false, // Disabled for now
    layout: 'spacious'
  },
  pdf: {
    name: 'PDF Format',
    width: '210mm',
    height: '297mm',
    styles: {
      container: '',
      header: '',
      body: '',
      footer: ''
    },
    showLogo: true,
    showTerms: true,
    showQRCode: false,
    layout: 'spacious'
  }
};

// Action configurations based on document state
export const getActionConfigs = (data: DocumentData): Record<string, ActionConfig> => {
  const hasEmail = !!data.customer?.email;

  return {
    toggleFormat: {
      icon: null, // Will be set by component
      label: 'Switch Format',
      enabled: true
    },
    download: {
      icon: null, // Will be set by component
      label: 'Download',
      enabled: true,
      primary: true
    },
    email: {
      icon: null, // Will be set by component
      label: 'Email',
      enabled: hasEmail
    },
    print: {
      icon: null, // Will be set by component
      label: 'Print',
      enabled: true
    }
  };
};

// Document type display names
export const DOCUMENT_TYPE_NAMES: Record<DocumentData['type'], string> = {
  receipt: 'Receipt',
  invoice: 'Invoice',
  ticket: 'Repair Ticket',
  quote: 'Quote'
};

// Status display configurations
export const STATUS_CONFIGS = {
  pending: { label: 'Pending', color: 'yellow' },
  in_progress: { label: 'In Progress', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  paid: { label: 'Paid', color: 'green' },
  partially_paid: { label: 'Partially Paid', color: 'blue' },
  not_paid: { label: 'Not Paid', color: 'red' }
} as const;

// VAT configuration
export const VAT_CONFIG = {
  rate: 0.20, // 20%
  label: 'VAT (20%)'
};

// Company information
export const COMPANY_CONFIG = {
  name: "O'MEGA SERVICES",
  address: '400 Rue nationale, 69400 Villefranche S/S',
  phone: '0986608980',
  email: 'contact@omegaservices.fr',
  taxId: 'FR123456789',
  logoUrl: '/omegalogo.png' // Use local file instead of GitHub URL
};

// Terms and conditions by document type
export const TERMS_CONFIG: Record<DocumentData['type'], string[]> = {
  ticket: [
    'All repairs come with a 90-day warranty.',
    'Payment is due upon completion of service.',
    'Devices not claimed within 90 days will be subject to disposal or recycling.',
    'We are not responsible for data loss during repairs.'
  ],
  invoice: [
    'Payment is due within 30 days of invoice date.',
    'Late payments are subject to a 2% monthly interest charge.',
    'All products come with a standard 1-year warranty.',
    'Returns accepted within 14 days with original packaging.'
  ],
  receipt: [
    'This receipt serves as proof of purchase.',
    'All sales are final unless otherwise stated.',
    'For exchanges or returns, please contact customer service.'
  ],
  quote: [
    'This quote is valid for 30 days.',
    'Prices may change based on final specifications.',
    'Final pricing confirmed upon order placement.'
  ]
};
