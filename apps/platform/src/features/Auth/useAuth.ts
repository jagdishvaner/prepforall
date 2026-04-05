import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useInitAuth() {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const { data } = await axios.post(
          `${API_BASE}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAuth(data.access_token);
      } catch {
        clearAuth();
      }
    };

    tryRefresh();
  }, [setAuth, clearAuth, setLoading]);
}
