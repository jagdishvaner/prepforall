import { apiClient } from '../apiClient';

export interface SubmitRequest {
  problemSlug: string;
  language: string;
  code: string;
}

export interface Submission {
  id: string;
  problemSlug: string;
  language: string;
  verdict: string;
  runtimeMs?: number;
  memoryKb?: number;
  passedCases: number;
  totalCases: number;
  errorMsg?: string;
  createdAt: string;
}

export const submissionsApi = {
  submit: async (req: SubmitRequest) => {
    const { data } = await apiClient.post<{ submission_id: string }>('/api/v1/submissions', req);
    return data;
  },
  run: async (req: SubmitRequest) => {
    const { data } = await apiClient.post('/api/v1/submissions/run', req);
    return data;
  },
  getByProblem: async (slug: string) => {
    const { data } = await apiClient.get<Submission[]>(`/api/v1/problems/${slug}/submissions`);
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<Submission>(`/api/v1/submissions/${id}`);
    return data;
  },
};
