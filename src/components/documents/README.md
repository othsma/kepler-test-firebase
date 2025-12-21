# Unified Document System

This directory contains the unified document system for the O'MEGA SERVICES application. It replaces multiple overlapping receipt and invoice components with a single, consistent system.

## Architecture Overview

The system uses a **configuration-driven architecture** with clear separation of concerns:

- **Data Layer**: `DocumentTypes.ts` + `DocumentConverter.ts` - Type-safe data models and conversion
- **Configuration Layer**: `DocumentConfig.ts` - Format specifications and styling
- **Presentation Layer**: `UnifiedDocument.tsx` + format renderers - UI components
- **Action Layer**: `actions/` - Document operations (print, email, download)

## Directory Structure

```
documents/
├── README.md                # This file
├── DocumentTypes.ts         # Shared type definitions
├── DocumentConverter.ts     # Data conversion utilities
├── DocumentConfig.ts        # Format configurations and styling
├── UnifiedDocument.tsx      # Main container with composition
├── formats/                 # Format-specific renderers
│   ├── ThermalFormat.tsx    # Thermal receipt renderer
│   ├── A4Format.tsx         # A4 invoice renderer
│   └── PDFFormat.tsx        # PDF renderer
├── actions/                 # Action components
│   ├── PrintAction.tsx      # Print functionality
│   ├── EmailAction.tsx      # Email functionality
│   ├── DownloadAction.tsx   # Download functionality
│   └── FormatToggle.tsx     # Format switching
└── hooks/                   # Custom hooks
    └── useDocumentActions.ts # Document action logic
```

## Usage

To use the unified document system, import the `UnifiedDocument` component and the appropriate converter function:

```tsx
import UnifiedDocument from '../components/documents/UnifiedDocument';
import { convertReceiptToDocument } from '../components/documents/DocumentConverter';

// ...

{showDocument && (
  <UnifiedDocument
    data={convertReceiptToDocument(receiptData)}
    onClose={() => setShowDocument(false)}
    initialFormat="thermal" // or "a4"
  />
)}
```

## Document Actions

The system provides comprehensive document actions:

- **Format Toggle**: Switch between Thermal and A4 formats
- **PDF Download**: Generate pixel-perfect PDF files matching the A4 preview (using html2canvas + jsPDF)
- **Image Download**: Download current view as PNG image (using html2canvas)
- **Email**: Send document via email (mailto link)
- **Print**: Browser print functionality

All actions are debounced to prevent multiple simultaneous operations and provide user feedback during processing.

### PDF Generation

The PDF download feature captures the exact A4 format document as displayed in the modal:

- **Pixel-Perfect Capture**: Uses html2canvas to capture the rendered A4 format
- **High Resolution**: 2x scale for crisp PDF output
- **A4 Dimensions**: Properly sized PDF with correct aspect ratio
- **Image Support**: Properly loads and includes logos and images
- **Fallback Support**: Falls back to @react-pdf/renderer if canvas capture fails
- **Dynamic Loading**: jsPDF loaded on-demand to minimize bundle size
- **Local Assets**: Uses local logo files to avoid CORS issues

## Data Structure

The unified document system uses a consistent data structure defined in `DocumentTypes.ts`:

```typescript
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
  type: 'receipt' | 'invoice' | 'ticket' | 'quote';
  
  // Additional fields for tickets
  deviceType?: string;
  brand?: string;
  model?: string;
  passcode?: string;
  
  // Source information
  sourceType?: 'pos' | 'ticket';
  sourceId?: string;
}
```

## Converter Functions

The `DocumentConverter.ts` file provides utility functions to convert from existing data structures to the unified `DocumentData` format:

- `convertTicketToDocument(ticket, clientId, client)`: Converts a repair ticket to the unified format
- `convertInvoiceToDocument(invoice)`: Converts an invoice to the unified format
- `convertReceiptToDocument(receipt)`: Converts a receipt to the unified format

## Format Switching

The `UnifiedDocument` component handles format switching internally. Users can toggle between formats using the built-in controls.

## Extending the System

To add a new document type:

1. Update the `DocumentTypes.ts` file to include any new fields
2. Create a new converter function in `DocumentConverter.ts`
3. Add type-specific rendering in the appropriate format components

To add a new format:

1. Create a new format component in the `formats/` directory
2. Update the `UnifiedDocument.tsx` component to include the new format option
3. Update the `DocumentFormat` type in `DocumentTypes.ts`

## Migration

For detailed instructions on migrating from the old components to the unified document system, see the [Document Migration Guide](../../cline_docs/documentMigrationGuide.md).
