import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { LoginModal } from '@/features/Auth/LoginModal';
import { useInitAuth } from '@/features/Auth/useAuth';
import { useAuthStore } from '@/stores/authStore';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  useInitAuth();
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Outlet />
      <LoginModal />
      <Toaster richColors position="top-right" />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  );
}
