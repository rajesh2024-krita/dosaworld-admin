# RBAC Dashboard Application

## Overview

This is a modern Role-Based Access Control (RBAC) dashboard application built with React and TypeScript. The application provides a comprehensive user and role management system with authentication, permissions, activity logging, and administrative features. It's designed as a full-stack application with a React frontend, Express.js backend, and includes features like billing management, reporting, and real-time activity monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built using React 18 with TypeScript and follows a modern component-based architecture:

- **UI Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui components for consistent design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state and React Context for authentication
- **Form Handling**: React Hook Form with Zod validation for type-safe forms
- **Theme System**: Custom theme provider supporting light/dark modes with system preference detection

The application uses a modular structure with dedicated directories for pages, components, hooks, and utilities. The UI components are built on Radix UI primitives for accessibility and customization.

### Backend Architecture

The backend follows a minimalist Express.js architecture:

- **Server Framework**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM configured for PostgreSQL with schema validation
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development
- **Development Setup**: Vite integration for hot module replacement and development workflow
- **Build Process**: ESBuild for production bundling with separate client/server builds

The server includes middleware for request logging, error handling, and static file serving in production.

### Authentication & Authorization

The application implements a comprehensive RBAC system:

- **Authentication**: Custom authentication service with session management
- **Permission System**: Granular permissions organized by modules (dashboard, users, roles, reports, settings, billing)
- **Role Management**: Dynamic role creation with customizable permission sets
- **Protected Routes**: Component-level route protection based on user permissions
- **Quick Login**: Development feature for testing different role types

### Data Management

Data persistence is handled through multiple layers:

- **Database Schema**: Drizzle ORM with PostgreSQL configuration for production
- **Local Storage**: Browser localStorage for development and demo data
- **Activity Logging**: Comprehensive audit trail for user actions and system events
- **Sample Data**: Pre-populated demo data for immediate functionality

### Component Architecture

The UI follows a layered component structure:

- **Layout Components**: Responsive sidebar and header with mobile support
- **Page Components**: Full-page views for each application section
- **Modal Components**: Reusable dialogs for create/edit operations
- **UI Components**: Design system components based on shadcn/ui
- **Form Components**: Validated form inputs with error handling

### Development Environment

The project is optimized for development with Replit integration:

- **Hot Reload**: Vite development server with instant updates
- **Error Overlay**: Runtime error display for debugging
- **Cartographer Integration**: Replit-specific development tools
- **TypeScript**: Full type safety across frontend and backend
- **Path Aliases**: Clean import paths for better organization

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with hooks and concurrent features
- **Express.js**: Backend web framework for API and static serving
- **TypeScript**: Type safety across the entire application
- **Vite**: Build tool and development server

### Database & ORM
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **Drizzle Kit**: Database migration and schema management tools

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library for consistent iconography
- **Recharts**: Chart library for data visualization

### Form & Validation
- **React Hook Form**: Performant form handling
- **Zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### Development Tools
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit development integration
- **ESBuild**: Fast JavaScript bundler for production builds

### Utility Libraries
- **nanoid**: Unique ID generation
- **date-fns**: Date manipulation utilities
- **clsx & tailwind-merge**: Conditional CSS class handling
- **class-variance-authority**: Component variant management

The application is designed to work seamlessly in the Replit environment while maintaining compatibility with standard Node.js deployments.