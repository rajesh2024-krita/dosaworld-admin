import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { useState } from "react";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Users from "@/pages/users";
import Roles from "@/pages/roles";
import ActivityLogs from "@/pages/activity-logs";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Billing from "@/pages/billing";
import NoAccess from "@/pages/no-access";
import NotFound from "@/pages/not-found";
import MenuManagement from "./pages/MenuManagement";

// Layout Components
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ProtectedRoute from "@/components/auth/protected-route";
import ReservationPage from "./pages/Reservation";
import EODBilling from "./pages/EODBilling";
import InventoryManagement from "./pages/InventoryManagement";
import OfferMaganement from "./pages/OfferManagement";
import PartyManagement from "./pages/PartyManagement";

function DashboardLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="lg:pl-64">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          title={title}
        />
        
        <main className="p-6" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/dashboard">
        <DashboardLayout title="Dashboard">
          <ProtectedRoute requiredPermission="dashboard:read">
            <Dashboard />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/user-management">
        <DashboardLayout title="User Management">
          <ProtectedRoute requiredPermission="users:read">
            <Users />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      <Route path="/menu-management">
        <DashboardLayout title="Menu Management">
          <ProtectedRoute requiredPermission="users:read">
            <MenuManagement />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      <Route path="/party-management">
        <DashboardLayout title="Party Management">
          <ProtectedRoute requiredPermission="users:read">
            <PartyManagement />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      <Route path="/reservation-management">
        <DashboardLayout title="Reservation Management">
          <ProtectedRoute requiredPermission="users:read">
            <ReservationPage />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      <Route path="/party-management">
        <DashboardLayout title="User Management">
          <ProtectedRoute requiredPermission="users:read">
            <Users />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      {/* <Route path="/inventory-management">
        <DashboardLayout title="User Management">
          <ProtectedRoute requiredPermission="users:read">
            <Users />
          </ProtectedRoute>
        </DashboardLayout>
      </Route> */}
      
      <Route path="/roles">
        <DashboardLayout title="Role Management">
          <ProtectedRoute requiredPermission="roles:read">
            <Roles />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/activity-logs">
        <DashboardLayout title="Activity Logs">
          <ProtectedRoute requiredPermission="dashboard:read">
            <ActivityLogs />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/reports">
        <DashboardLayout title="Reports">
          <ProtectedRoute requiredPermission="reports:read">
            <Reports />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/settings">
        <DashboardLayout title="Settings">
          <ProtectedRoute requiredPermission="settings:read">
            <Settings />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/billing-management">
        <DashboardLayout title="Billing">
          <ProtectedRoute requiredPermission="billing:read">
            <EODBilling />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/inventory-management">
        <DashboardLayout title="Inventory Management">
          <ProtectedRoute requiredPermission="billing:read">
            <InventoryManagement />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/offer-management">
        <DashboardLayout title="Offer Management">
          <ProtectedRoute requiredPermission="billing:read">
            <OfferMaganement />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/no-access">
        <DashboardLayout title="Access Denied">
          <NoAccess />
        </DashboardLayout>
      </Route>
      
      {/* Default redirect to dashboard */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      
      {/* Fallback to 404 */}
      <Route>
        <DashboardLayout title="Page Not Found">
          <NotFound />
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      
      <Route>
        {!isAuthenticated ? <Redirect to="/login" /> : <AuthenticatedRoutes />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
