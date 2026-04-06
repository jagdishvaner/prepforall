export type UserRole = 'super_admin' | 'org_admin' | 'trainer' | 'student';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  orgId?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}
