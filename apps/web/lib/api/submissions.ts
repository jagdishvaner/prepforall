import { apiClient } from "./client";
import type { Submission } from "@/types";

export interface SubmitRequest {
  problemId: string;
  language: string;
  code: string;
  contestId?: string;
}

export const submissionsApi = {
  submit: async (req: SubmitRequest): Promise<Submission> => {
    const { data } = await apiClient.post("/api/v1/submissions", {
      problem_id: req.problemId,
      language: req.language,
      code: req.code,
      contest_id: req.contestId,
    });
    return data;
  },

  getById: async (id: string): Promise<Submission> => {
    const { data } = await apiClient.get(`/api/v1/submissions/${id}`);
    return data;
  },

  listMine: async (): Promise<Submission[]> => {
    const { data } = await apiClient.get("/api/v1/submissions");
    return data;
  },
};
