import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/permissions';
import type { Permission } from '@shared/schema';
import NoAccess from '@/pages/no-access';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null; // This will redirect to login via App routing
  }

  if (requiredPermission && !hasPermission(user.permissions, requiredPermission)) {
    return <NoAccess />;
  }

  return <>{children}</>;
}
