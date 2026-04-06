import { apiClient } from '../apiClient';

export const usersApi = {
  getProfile: async (username: string) => {
    const { data } = await apiClient.get(`/api/v1/users/${username}`);
    return data;
  },
  getStats: async (username: string) => {
    const { data } = await apiClient.get(`/api/v1/users/${username}/stats`);
    return data;
  },
  invite: async (req: { email: string; role: string; org_id: string; batch_id?: string }) => {
    const { data } = await apiClient.post('/api/v1/users/invite', req);
    return data;
  },
};
