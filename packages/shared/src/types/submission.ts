export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: string;
  verdict: Verdict;
  runtimeMs?: number;
  memoryKb?: number;
  passedCases: number;
  totalCases: number;
  errorMsg?: string;
  createdAt: string;
  judgedAt?: string;
}

export type Verdict = "PENDING" | "RUNNING" | "AC" | "WA" | "TLE" | "MLE" | "RE" | "CE";
