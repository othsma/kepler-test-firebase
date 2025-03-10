# Tech Stack

## Frontend Framework
- **React**: A JavaScript library for building user interfaces
- **TypeScript**: Adds static typing to JavaScript for better developer experience and code quality
- **Vite**: Modern build tool that provides faster development experience

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Headless UI**: Unstyled, accessible UI components
- **Lucide React**: Icon library with a clean, consistent design
- **clsx**: Utility for conditionally joining class names

## State Management
- **Zustand**: Lightweight state management library
  - Used for managing application state with separate stores for different domains:
    - Theme store (dark/light mode)
    - User preferences store
    - Authentication store
    - Clients store
    - Tickets store
    - Products store
    - Orders store
    - Invoices store

## Routing
- **React Router**: Library for handling routing in React applications
  - Implements protected routes with role-based access control

## Backend and Database
- **Firebase**: Google's platform for mobile and web application development
  - **Firebase Authentication**: For user authentication and management
  - **Firestore**: NoSQL document database for storing application data
  - **Firebase Storage**: For storing files and images

## Data Visualization
- **Recharts**: Composable charting library built on React components
  - Used for dashboard charts and analytics

## Date Handling
- **date-fns**: Modern JavaScript date utility library
  - Used for formatting dates and time calculations

## Document Generation
- **React PDF Renderer**: For generating PDF documents
- **html2canvas**: For converting HTML elements to canvas for image download
- **QRCode.react**: For generating QR codes in receipts and invoices

## Architecture Decisions

### Role-Based Access Control
- Two main roles: Super Admin and Technician
- Access control implemented at both routing and component levels
- Different data access patterns based on user role

### State Management Strategy
- Domain-specific stores using Zustand
- Each store handles its own data fetching, updates, and state management
- Stores interact with Firebase services directly

### Data Flow
- Components subscribe to relevant stores
- Stores handle data fetching and mutations
- Firebase listeners update state in real-time when possible

### Responsive Design
- Mobile-first approach using Tailwind CSS
- Responsive layout with collapsible sidebar
- Adaptive components that work across device sizes

### Receipt and Invoice Generation
- Unified component for generating different types of documents
- Support for both thermal (narrow) and A4 formats
- Multiple output options: print, email, download

### Form Handling
- Custom form components with validation
- Dynamic form fields based on user input
- Autocomplete and suggestion features for better UX
