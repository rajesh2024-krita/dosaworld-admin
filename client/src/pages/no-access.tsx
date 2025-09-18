import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Ban, Home } from 'lucide-react';

export default function NoAccess() {
  const [, setLocation] = useLocation();

  const goToDashboard = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-destructive/10 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Ban className="w-12 h-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-card-foreground mb-4">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Button onClick={goToDashboard} className="flex items-center space-x-2" data-testid="button-go-dashboard">
          <Home className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Button>
      </div>
    </div>
  );
}
