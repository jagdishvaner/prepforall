import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';
import { Link, useNavigate } from '@tanstack/react-router';
import { Moon, Sun, User, LogOut } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export function AppNavbar() {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await apiClient.post('/api/v1/auth/logout'); } catch { /* ignore */ }
    clearAuth();
    navigate({ to: '/' });
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <div />
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="rounded p-1.5 hover:bg-muted">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-muted">
            <User className="h-4 w-4" />
            {user?.username}
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 min-w-[160px] rounded-md border border-border bg-background p-1 shadow-md" sideOffset={8}>
              <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted" asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item onClick={handleLogout}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10">
                <LogOut className="h-3 w-3" /> Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
