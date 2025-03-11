# Unified Document System

This directory contains the unified document system for the O'MEGA SERVICES application. It replaces multiple overlapping receipt and invoice components with a single, consistent system.

## Directory Structure

```
documents/
├── README.md                # This file
├── DocumentTypes.ts         # Shared type definitions
├── DocumentConverter.ts     # Utilities for converting from old formats
├── UnifiedDocument.tsx      # Main container component
├── formats/                 # Format-specific components
│   ├── ThermalFormat.tsx    # Thermal receipt format
│   ├── A4Format.tsx         # A4 paper format
│   └── PDFFormat.tsx        # PDF format
├── types/                   # Document type-specific components
│   ├── ReceiptType.tsx      # Receipt-specific content
│   ├── InvoiceType.tsx      # Invoice-specific content
│   └── TicketType.tsx       # Repair ticket-specific content
└── actions/                 # Action components
    ├── PrintAction.tsx      # Print functionality
    ├── EmailAction.tsx      # Email functionality
    └── DownloadAction.tsx   # Download functionality
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
    initialFormat="thermal" // or "a4" or "pdf"
  />
)}
```

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
