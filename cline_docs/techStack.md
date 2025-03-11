# Tech Stack Documentation

## Frontend Framework
- **React 18**: Modern UI library for building component-based interfaces
- **TypeScript**: Adds static typing to JavaScript for better developer experience and code quality
- **Vite**: Fast, modern frontend build tool that significantly improves development experience

## State Management
- **Zustand**: Lightweight state management library that simplifies global state handling
  - Used for managing application state including authentication, clients, tickets, products, orders, and invoices
  - Chosen for its simplicity and performance compared to Redux

## Styling
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
  - Enables consistent styling across the application
  - Provides responsive design capabilities out of the box
- **Headless UI**: Unstyled, accessible UI components that integrate well with Tailwind

## Routing
- **React Router v6**: Declarative routing for React applications
  - Handles navigation between different pages
  - Provides route protection for authenticated routes

## Backend & Database
- **Firebase**: Google's platform for mobile and web application development
  - **Firebase Authentication**: Handles user authentication and management
  - **Firestore**: NoSQL cloud database for storing application data
  - **Firebase Storage**: For storing files like product images

## Icons & UI Elements
- **Lucide React**: Modern icon library with a clean, consistent design
- **Recharts**: Composable charting library for data visualization
- **date-fns**: Modern JavaScript date utility library

## Document Generation
- **@react-pdf/renderer**: React renderer for creating PDF documents
- **html2canvas**: Captures DOM nodes as canvas elements for image generation
- **QRCode.react**: QR code generator for React applications

## Architecture Decisions

### Role-Based Access Control
- Two main roles: SUPER_ADMIN and TECHNICIAN
- Role-based route protection using React Router
- Role-specific data fetching to ensure users only access appropriate data

### State Management Strategy
- Zustand stores organized by domain (clients, tickets, products, etc.)
- Each store handles its own CRUD operations and Firebase interactions
- Optimistic UI updates for better user experience

### Component Structure
- Layout component for consistent page structure
- Reusable UI components for common elements
- Page components for specific features

### Data Flow
1. User actions trigger Zustand store methods
2. Store methods update Firebase (Firestore)
3. On successful Firebase operations, local state is updated
4. UI reacts to state changes

### Authentication Flow
1. User logs in via Firebase Authentication
2. Auth state changes are monitored via onAuthStateChanged
3. User role is fetched from Firestore
4. Based on role, appropriate data is loaded
5. Protected routes ensure proper access control

### Responsive Design Strategy
- Mobile-first approach using Tailwind's responsive utilities
- Sidebar collapses on smaller screens
- Responsive grid layouts for different screen sizes

### Document System Architecture
- **Unified Document System**: Consolidated approach to document generation
  - Replaces multiple overlapping components with a single, flexible system
  - Supports multiple formats (Thermal, A4, PDF) through a common interface
  
- **Core Components**:
  - `DocumentTypes.ts`: TypeScript interfaces defining document data structure
  - `DocumentConverter.ts`: Utilities to convert legacy formats to the new system
  - `UnifiedDocument.tsx`: Container component with format switching capabilities
  
- **Format Components**:
  - Format-specific rendering components that implement a common interface
  - Each format (Thermal, A4, PDF) has its own component with specialized rendering
  - Formats can be easily switched at runtime
  
- **Benefits**:
  - Reduced code duplication
  - Consistent document styling and behavior
  - Easier maintenance and feature additions
  - Better type safety through TypeScript interfaces
