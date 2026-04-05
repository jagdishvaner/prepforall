import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { apiClient } from '../apiClient';

export interface ProblemsFilter {
  difficulty?: string;
  q?: string;
  page?: number;
  tab?: 'all' | 'dsa' | 'sql' | 'assigned';
}

export function useProblems(filter: ProblemsFilter = {}) {
  return useQuery({
    queryKey: queryKeys.problems.list(filter as Record<string, unknown>),
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/problems', { params: filter });
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useProblem(slug: string) {
  return useQuery({
    queryKey: queryKeys.problems.detail(slug),
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/v1/problems/${slug}`);
      return data;
    },
    staleTime: 10 * 60_000,
    enabled: !!slug,
  });
}
