# Document System Migration Guide

This guide outlines the steps to migrate from the current multiple receipt/invoice components to the new unified document system.

## Overview

The current system has several overlapping components:
- `ThermalReceipt.tsx`
- `TicketReceipt.tsx`
- `UnifiedTicketReceipt.tsx`
- `InvoiceReceipt.tsx`
- `A4Invoice.tsx`
- `A4InvoicePDF.tsx`
- `ReceiptFormatSelector.tsx`

These will be replaced with a unified document system:
- `UnifiedDocument.tsx` - Main container component
- `DocumentTypes.ts` - Shared interfaces
- `DocumentConverter.ts` - Utilities for data conversion
- Format-specific components in `formats/` directory
- Type-specific components in `types/` directory
- Action components in `actions/` directory

## Migration Steps

### 1. Identify Usage Points

The following files need to be updated to use the new system:

- `Pos.tsx` - Uses `ThermalReceipt.tsx`
- `SimpleTickets.tsx` - Uses `TicketReceipt.tsx` and `UnifiedTicketReceipt.tsx`
- `Invoices.tsx` - Uses `InvoiceReceipt.tsx`
- `Orders.tsx` - Uses receipt components

### 2. Update Each Usage Point

#### For Pos.tsx:

```tsx
// BEFORE
import ThermalReceipt from '../components/ThermalReceipt';

// ...

{showReceipt && (
  <ThermalReceipt
    invoice={receiptData}
    onClose={() => setShowReceipt(false)}
  />
)}

// AFTER
import UnifiedDocument from '../components/documents/UnifiedDocument';
import { convertReceiptToDocument } from '../components/documents/DocumentConverter';

// ...

{showReceipt && (
  <UnifiedDocument
    data={convertReceiptToDocument(receiptData)}
    onClose={() => setShowReceipt(false)}
    initialFormat="thermal"
  />
)}
```

#### For SimpleTickets.tsx:

```tsx
// BEFORE
import TicketReceipt from '../components/TicketReceipt';
// or
import UnifiedTicketReceipt from '../components/UnifiedTicketReceipt';

// ...

{selectedTicket && (
  <TicketReceipt
    ticket={selectedTicket}
    clientId={selectedTicket.clientId}
    onClose={() => setSelectedTicket(null)}
  />
)}

// AFTER
import UnifiedDocument from '../components/documents/UnifiedDocument';
import { convertTicketToDocument } from '../components/documents/DocumentConverter';

// ...

{selectedTicket && (
  <UnifiedDocument
    data={convertTicketToDocument(
      selectedTicket,
      selectedTicket.clientId,
      clients.find(c => c.id === selectedTicket.clientId)
    )}
    onClose={() => setSelectedTicket(null)}
    initialFormat="thermal" // or "a4" based on preference
  />
)}
```

#### For Invoices.tsx:

```tsx
// BEFORE
import InvoiceReceipt from '../components/InvoiceReceipt';
// or
import A4Invoice from '../components/A4Invoice';

// ...

{selectedInvoice && (
  <InvoiceReceipt
    invoice={selectedInvoice}
    onClose={() => setSelectedInvoice(null)}
    format={receiptFormat}
  />
)}

// AFTER
import UnifiedDocument from '../components/documents/UnifiedDocument';
import { convertInvoiceToDocument } from '../components/documents/DocumentConverter';

// ...

{selectedInvoice && (
  <UnifiedDocument
    data={convertInvoiceToDocument(selectedInvoice)}
    onClose={() => setSelectedInvoice(null)}
    initialFormat={receiptFormat} // "thermal" or "a4"
  />
)}
```

### 3. Replace Format Selector

```tsx
// BEFORE
import ReceiptFormatSelector from '../components/ReceiptFormatSelector';

// ...

<ReceiptFormatSelector
  selectedFormat={receiptFormat}
  onFormatChange={setReceiptFormat}
/>

// AFTER
// The format selection is now handled within the UnifiedDocument component
// No separate selector is needed
```

### 4. Testing Checklist

After migration, verify that:

- [ ] All documents render correctly in both thermal and A4 formats
- [ ] Print functionality works as expected
- [ ] Email functionality works when customer email is available
- [ ] Download functionality generates correct images
- [ ] QR codes are generated and contain correct data
- [ ] All document types (receipts, invoices, tickets) display appropriate information
- [ ] Format switching works correctly

### 5. Cleanup

Once all usage points have been migrated and tested, the following files can be removed:

- [ ] `ThermalReceipt.tsx`
- [ ] `TicketReceipt.tsx`
- [ ] `UnifiedTicketReceipt.tsx`
- [ ] `InvoiceReceipt.tsx`
- [ ] `A4Invoice.tsx`
- [ ] `A4InvoicePDF.tsx`
- [ ] `ReceiptFormatSelector.tsx`

## Benefits of Migration

- **Reduced Code Duplication**: Single source of truth for document rendering
- **Consistent UI**: Standardized look and feel across all document types
- **Easier Maintenance**: Changes to document rendering only need to be made in one place
- **Better Type Safety**: Consistent interfaces reduce errors
- **Improved Performance**: Shared functionality reduces bundle size
