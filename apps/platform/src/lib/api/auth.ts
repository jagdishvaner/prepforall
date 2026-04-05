import { apiClient } from '../apiClient';

export interface LoginRequest { email: string; password: string; }

export const authApi = {
  login: async (req: LoginRequest) => {
    const { data } = await apiClient.post('/api/v1/auth/login', req);
    return data as { access_token: string; expires_in: number };
  },
  refresh: async () => {
    const { data } = await apiClient.post('/api/v1/auth/refresh');
    return data as { access_token: string; expires_in: number };
  },
  logout: async () => {
    await apiClient.post('/api/v1/auth/logout');
  },
  setup: async (req: { token: string; username: string; password: string }) => {
    const { data } = await apiClient.post('/api/v1/auth/setup', req);
    return data as { access_token: string; expires_in: number };
  },
  forgotPassword: async (email: string) => {
    await apiClient.post('/api/v1/auth/forgot-password', { email });
  },
  resetPassword: async (req: { token: string; password: string }) => {
    await apiClient.post('/api/v1/auth/reset-password', req);
  },
};
