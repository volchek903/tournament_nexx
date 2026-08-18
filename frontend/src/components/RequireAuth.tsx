import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useCurrentUser } from '@/hooks/useAppSelectors';

export default function RequireAuth() {
  const user = useCurrentUser();
  const initialized = useAppStore((state) => state.initialized);
  const location = useLocation();

  if (!initialized) {
    return <div className="min-h-[60vh]" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
