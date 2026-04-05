import { apiClient } from '../apiClient';

export interface SubmitRequest {
  problemSlug: string;
  language: string;
  code: string;
}

export interface Submission {
  id: string;
  user_id: string;
  problem_id: string;
  language: string;
  verdict: string;
  runtime_ms?: number;
  memory_kb?: number;
  passed_cases: number;
  total_cases: number;
  error_msg?: string;
  created_at: string;
}

export const submissionsApi = {
  submit: async (req: SubmitRequest) => {
    const { data } = await apiClient.post<Submission>('/api/v1/submissions', {
      problem_slug: req.problemSlug,
      language: req.language,
      code: req.code,
    });
    return data;
  },
  run: async (req: SubmitRequest) => {
    const { data } = await apiClient.post<{ run_id: string }>('/api/v1/submissions/run', {
      problem_slug: req.problemSlug,
      language: req.language,
      code: req.code,
    });
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
