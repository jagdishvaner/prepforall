import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';
import { StudentDashboard } from '@/features/Dashboard/StudentDashboard';
import { TrainerDashboard } from '@/features/Dashboard/TrainerDashboard';
import { OrgAdminDashboard } from '@/features/Dashboard/OrgAdminDashboard';
import { SuperAdminDashboard } from '@/features/Dashboard/SuperAdminDashboard';

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const role = useAuthStore((s) => s.user?.role);

  switch (role) {
    case 'super_admin': return <SuperAdminDashboard />;
    case 'org_admin': return <OrgAdminDashboard />;
    case 'trainer': return <TrainerDashboard />;
    case 'student': default: return <StudentDashboard />;
  }
}
