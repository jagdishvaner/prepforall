import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useInitAuth() {
  const { setAuth, clearAuth, isAuthenticated, accessToken } = useAuthStore();

  useEffect(() => {
    // Only attempt silent refresh if we don't already have a token in memory
    // (i.e., on fresh page load, not after a successful login)
    if (accessToken) {
      return;
    }

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
  }, []); // Run once on mount only
}
