import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

type AppRole = 'admin' | 'driver' | 'customer';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading, roleLoading } = useAuth();
  const location = useLocation();

  // Server-side re-validation for admin pages. Even if a session exists
  // in local storage, we ask the Auth server "is this token still valid?"
  // on every admin navigation. Prevents stale/forged tokens from granting access.
  const needsAdmin = allowedRoles?.includes('admin') && allowedRoles.length === 1;
  const [adminVerified, setAdminVerified] = useState<null | boolean>(needsAdmin ? null : true);

  useEffect(() => {
    if (!needsAdmin) return;
    if (!user) {
      setAdminVerified(false);
      return;
    }
    let cancelled = false;
    setAdminVerified(null);
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;
      setAdminVerified(!error && !!data?.user);
    })();
    return () => { cancelled = true; };
  }, [user?.id, location.pathname, needsAdmin]);

  if (loading || (user && roleLoading) || (needsAdmin && adminVerified === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (needsAdmin && adminVerified === false)) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      const roleRedirects: Record<AppRole, string> = {
        admin: '/admin',
        driver: '/driver',
        customer: '/customer',
      };
      const redirectPath = role ? roleRedirects[role] : '/';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
}

