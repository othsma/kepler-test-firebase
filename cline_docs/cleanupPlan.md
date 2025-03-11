# Project Cleanup Plan

## Receipt/Invoice System Consolidation

### Problem
The project currently has multiple overlapping components for handling receipts, invoices, and tickets:

- `ThermalReceipt.tsx`
- `TicketReceipt.tsx`
- `UnifiedTicketReceipt.tsx`
- `InvoiceReceipt.tsx`
- `A4Invoice.tsx`
- `A4InvoicePDF.tsx`
- `ReceiptFormatSelector.tsx`

These components have significant code duplication and make maintenance difficult.

### Solution
We've implemented a unified document system that consolidates all receipt/invoice functionality:

#### Core Components
- `DocumentTypes.ts`: Shared interfaces for consistent data structure
- `DocumentConverter.ts`: Utilities to convert from old formats
- `UnifiedDocument.tsx`: Main container component with format switching

#### Format Components
- `ThermalFormat.tsx`: For thermal receipt printing
- `A4Format.tsx`: For A4 paper format
- `PDFFormat.tsx`: For PDF generation

#### Directory Structure
```
src/components/documents/
├── DocumentTypes.ts
├── DocumentConverter.ts
├── UnifiedDocument.tsx
├── README.md
└── formats/
    ├── ThermalFormat.tsx
    ├── A4Format.tsx
    └── PDFFormat.tsx
```

### Migration Progress
- [x] Created unified document system architecture
- [x] Implemented core components
- [x] Implemented format components
- [x] Created migration guide
- [x] Updated `SimpleTickets.tsx` to use the new system
- [x] Updated `Pos.tsx` to use the new system
- [x] Updated `Invoices.tsx` to use the new system
- [x] Updated `Orders.tsx` to use the new system
- [ ] Remove deprecated components

### Benefits
- **Reduced Code Duplication**: Single source of truth for document rendering
- **Consistent UI**: Standardized look and feel across all document types
- **Easier Maintenance**: Changes to document rendering only need to be made in one place
- **Better Type Safety**: Consistent interfaces reduce errors
- **Improved Performance**: Shared functionality reduces bundle size

## Other Areas for Cleanup

### Form Handling
- [ ] Standardize form handling across components
- [ ] Create reusable form components for common patterns

### UI Components
- [ ] Create a unified status badge component
- [ ] Standardize button styles and behaviors

### State Management
- [ ] Review and optimize store.ts
- [ ] Remove any redundant state management

### Code Quality
- [ ] Remove unused imports
- [ ] Fix TypeScript errors
- [ ] Add proper error handling
