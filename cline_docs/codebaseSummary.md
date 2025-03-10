# Codebase Summary

## Project Structure

The Kepler Test Firebase project follows a standard React application structure with TypeScript support. Here's an overview of the main directories and files:

```
/
├── public/                 # Static assets
├── src/                    # Source code
│   ├── components/         # Reusable UI components
│   ├── lib/                # Utilities and services
│   ├── pages/              # Page components
│   ├── App.tsx             # Main application component
│   ├── index.css           # Global styles
│   └── main.tsx            # Application entry point
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

## Key Components and Their Interactions

### Layout Components
- **Layout.tsx**: Main layout wrapper with sidebar and header
- **Sidebar.tsx**: Navigation sidebar with role-based menu items
- **Header.tsx**: Top navigation bar with user menu and theme toggle

### Authentication Components
- **Login.tsx**: User login form
- **Register.tsx**: User registration form
- **ForgotPassword.tsx**: Password reset form
- **Profile.tsx**: User profile management

### Ticket Management Components
- **TicketForm.tsx**: Form for creating and editing repair tickets
- **UnifiedTicketReceipt.tsx**: Component for generating receipts, quotes, and invoices
- **TicketReceipt.tsx**: Simplified receipt component

### Client Management Components
- **ClientForm.tsx**: Form for adding and editing client information

### POS Components
- **DailySalesWidget.tsx**: Widget displaying daily sales metrics
- **ReceiptFormatSelector.tsx**: Component for selecting receipt format
- **InvoiceForm.tsx**: Form for creating invoices
- **InvoiceReceipt.tsx**: Component for generating invoice receipts

## Data Flow

The application follows a unidirectional data flow pattern:

1. **User Interaction**: User interacts with a component (e.g., submits a form)
2. **Store Action**: Component calls a method from the appropriate store
3. **Firebase Operation**: Store performs CRUD operations on Firebase
4. **State Update**: Store updates its internal state based on Firebase response
5. **Component Re-render**: Components subscribed to the store re-render with new data

### Example Flow for Creating a Ticket:
- User fills out TicketForm and submits
- TicketForm calls `addTicket` method from useTicketsStore
- Store adds ticket to Firestore and updates local state
- Tickets page re-renders to show the new ticket
- Receipt is generated and displayed to the user

## External Dependencies

### Firebase Services
- **Authentication**: User management and role-based access
- **Firestore**: Document database for all application data
- **Storage**: File storage for images and documents

### UI Libraries
- **Tailwind CSS**: For styling components
- **Headless UI**: For accessible UI components like dropdowns and modals
- **Lucide React**: For icons throughout the application

### Utility Libraries
- **date-fns**: For date formatting and manipulation
- **html2canvas**: For converting receipts to downloadable images
- **QRCode.react**: For generating QR codes on receipts

## Recent Significant Changes

The project is currently in a stable state with all core functionality implemented:

- Role-based authentication system
- Repair ticket management
- Client management
- Point-of-sale system
- Invoicing and receipt generation
- Dashboard with key metrics

## User Feedback Integration

The application has been designed with user feedback in mind:

- **Technicians**: Need quick access to their assigned tickets and ability to update status
- **Super Admins**: Need comprehensive overview of business operations and ability to manage all aspects
- **Clients**: Need clear receipts and invoices with detailed information about services

The UI has been optimized for different user roles, with role-specific dashboards and access controls to ensure users only see what's relevant to them.
