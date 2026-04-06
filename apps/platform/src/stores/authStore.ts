import { create } from 'zustand';
import type { AuthUser, UserRole } from '@/types/auth';
import { parseJwtPayload } from '@/lib/auth';

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginModalOpen: boolean;

  setAuth: (token: string) => void;
  clearAuth: () => void;
  setLoginModalOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // true until initial refresh attempt completes
  loginModalOpen: false,

  setAuth: (token: string) => {
    const payload = parseJwtPayload(token);
    if (!payload) return;

    const user: AuthUser = {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      orgId: payload.org_id,
      avatarUrl: payload.avatar_url,
    };

    set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  setLoginModalOpen: (open) => set({ loginModalOpen: open }),
  setLoading: (loading) => set({ isLoading: loading }),

  hasRole: (...roles) => {
    const { user } = get();
    return user != null && roles.includes(user.role);
  },
}));
