import { apiClient } from "./client";
import type { Problem, TestCase } from "@/types";

export interface ProblemsFilter {
  difficulty?: string;
  q?: string;
  page?: number;
}

export const problemsApi = {
  list: async (filter: ProblemsFilter = {}): Promise<Problem[]> => {
    const { data } = await apiClient.get("/api/v1/problems", { params: filter });
    return data;
  },

  getBySlug: async (slug: string): Promise<Problem> => {
    const { data } = await apiClient.get(`/api/v1/problems/${slug}`);
    return data;
  },

  getSampleTestCases: async (slug: string): Promise<TestCase[]> => {
    const { data } = await apiClient.get(`/api/v1/problems/${slug}/testcases/sample`);
    return data;
  },
};
