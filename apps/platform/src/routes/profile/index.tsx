import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';
import { ProfilePage } from '@/features/Profile/ProfilePage';

export const Route = createFileRoute('/profile/')({
  beforeLoad: () => {
    const { isAuthenticated, setLoginModalOpen } = useAuthStore.getState();
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      throw redirect({ to: '/' });
    }
  },
  component: ProfilePage,
});
