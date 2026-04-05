export interface Problem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  difficulty: Difficulty;
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  acceptanceRate: number;
  totalSubmissions: number;
  createdAt: string;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface TestCase {
  id: string;
  input: string;
  output: string;
  isSample: boolean;
}
