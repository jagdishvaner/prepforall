export interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  rating: number;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  acceptanceRate: number;
  totalSubmissions: number;
  createdAt: string;
}

export interface TestCase {
  id: string;
  input: string;
  output: string;
  isSample: boolean;
}

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

export interface Contest {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
}

export interface UserStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
}
