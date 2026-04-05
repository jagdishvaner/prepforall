import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { LoginModal } from '@/features/Auth/LoginModal';
import { useInitAuth } from '@/features/Auth/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { AppLayout } from '@/features/Layout/AppLayout';

interface RouterContext {
  queryClient: QueryClient;
}

// Routes that should NOT show the sidebar/nav layout
const publicPaths = ['/login', '/auth/setup', '/auth/forgot-password', '/auth/reset-password', '/auth/oauth-callback'];

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  useInitAuth();
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useRouterState({ select: (s) => s.location });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const isPublicRoute = publicPaths.some((p) => location.pathname.startsWith(p));
  const showLayout = isAuthenticated && !isPublicRoute;

  return (
    <>
      {showLayout ? (
        <AppLayout>
          <Outlet />
        </AppLayout>
      ) : (
        <Outlet />
      )}
      <LoginModal />
      <Toaster richColors position="top-right" />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  );
}
