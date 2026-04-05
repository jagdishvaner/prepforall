import { apiClient } from '../apiClient';

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  acceptanceRate?: number;
  tags: string[];
  languages: string[];
  starter_code?: Record<string, string>;
}

export interface ProblemListResponse {
  problems: Problem[];
  total: number;
  page: number;
  pageSize: number;
}

export const problemsApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await apiClient.get<ProblemListResponse>('/api/v1/problems', { params });
    return data;
  },
  getBySlug: async (slug: string) => {
    const { data } = await apiClient.get<Problem>(`/api/v1/problems/${slug}`);
    return data;
  },
  getTestCases: async (slug: string) => {
    const { data } = await apiClient.get(`/api/v1/problems/${slug}/testcases`);
    return data;
  },
};
