import { Navigate } from '@tanstack/react-router';
import { useAuth } from '~/contexts/auth';
import { Spinner } from '~/components/ui/spinner';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}
