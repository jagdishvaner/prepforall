import { useLocation, Link } from '@tanstack/react-router';
import { Code2, Trophy, BarChart2, Users, Settings, LayoutDashboard, GraduationCap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/cn';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['student', 'trainer', 'org_admin', 'super_admin'] },
  { to: '/problems', icon: Code2, label: 'Problems', roles: ['student', 'trainer', 'org_admin', 'super_admin'] },
  { to: '/contests', icon: Trophy, label: 'Contests', roles: ['student', 'trainer', 'super_admin'] },
  { to: '/analytics', icon: BarChart2, label: 'Analytics', roles: ['trainer', 'org_admin', 'super_admin'] },
  { to: '/batches', icon: GraduationCap, label: 'Batches', roles: ['trainer', 'org_admin', 'super_admin'] },
  { to: '/org/members', icon: Users, label: 'Members', roles: ['org_admin', 'super_admin'] },
  { to: '/admin/organizations', icon: Settings, label: 'Admin', roles: ['super_admin'] },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const userRole = useAuthStore((s) => s.user?.role);

  const visibleItems = navItems.filter((item) =>
    userRole && (item.roles as readonly string[]).includes(userRole)
  );

  return (
    <aside className="hidden w-16 flex-shrink-0 flex-col items-center border-r border-border bg-muted/30 py-4 lg:flex">
      <Link to="/dashboard" className="mb-6 text-lg font-bold text-primary">P</Link>
      {visibleItems.map(({ to, icon: Icon, label }) => (
        <Link key={to} to={to} title={label}
          className={cn(
            'mb-1 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted transition-colors',
            location.pathname.startsWith(to) && 'bg-primary/10 text-primary'
          )}>
          <Icon className="h-5 w-5" />
        </Link>
      ))}
    </aside>
  );
}
