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
  quote: 'Quote',
  engagement: 'Client Engagement Contract'
};

// Status display configurations
export const STATUS_CONFIGS = {
  pending: { label: 'Pending', color: 'yellow' },
  in_progress: { label: 'In Progress', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  paid: { label: 'Payé', color: 'green' },
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
  address: '400 Rue nationale, 69400 Villefranche-Sur-Saône',
  phone: '0986608980',
  email: 'contact@omegaservices.fr',
  taxId: 'FR123456789',
  logoUrl: '/omegalogo.png' // Use local file instead of GitHub URL
};

// Terms and conditions by document type
export const TERMS_CONFIG: Record<DocumentData['type'], string[]> = {
  ticket: [
    'Le client est responsable de la sauvegarde de ses données.',
    'Diagnostic et devis possiblement payants.',
    'Délais indicatifs, non contractuels.',
    'Devis accepté avant intervention, frais de diagnostic 40 € TTC en cas de refus de réparation.',
    'Appareil non récupéré sous 30 jours = abandonné.',
    'Garantie 3 mois (hors casse, oxydation, mauvaise utilisation).'
  ],
  invoice: [
    'Aucun matériel ne sera restitué avant règlement intégral de la facture.',
    'Les réparations sont garanties 3 mois pièces et main-d’œuvre.',
    'Les produits vendus bénéficient d’une garantie standard de 1 an.',
    'Toute réclamation doit être formulée par écrit dans un délai de 7 jours suivant la facture.',
    'Les retours produits sont acceptés sous 14 jours avec emballage d’origine.',
  ],
  receipt: [
    'Ce reçu fait office de preuve d’achat.',
    'Les conditions générales de vente s’appliquent à toute transaction figurant sur ce reçu.',
    'Conservez ce reçu pour toute demande de garantie ou de service après‑vente.'
  ],
  quote: [
    'Ce devis est valable 30 jours à compter de sa date d’émission. ',
    'Les prix indiqués peuvent évoluer en fonction des spécifications finales.',
    'Toute modification demandée pourra entraîner une révision du devis.',
    'L’exécution des travaux débutera après réception de l’acompte prévu.',
    'Le tarif définitif sera confirmé lors de la validation de la commande. '
  ],
  engagement: [
    "Je reconnais avoir confié mon appareil à OMEGA SERVICES",
    "J'ai été informé(e) que je dois sauvegarder mes données avant toute intervention",
    "Le client reconnaît avoir été informé que l'intervention peut entraîner la perte de tout ou une partie de ses données et en accepte les conséquences",
    "J'accepte que le diagnostic puisse être payant",
    "Je reconnais que les délais sont indicatifs",
    "Je m'engage à régler la totalité de la prestation avant récupération de l'appareil",
    "Je reconnais la garantie de 3 mois applicable uniquement sur les pièces remplacées",
    "Tout appareil non récupéré sous 30 jours pourra être considéré comme abandonné"
  ]
};
