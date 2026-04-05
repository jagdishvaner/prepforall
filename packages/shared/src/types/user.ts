export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  rating: number;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

export type UserRole = "super_admin" | "org_admin" | "trainer" | "student";

export interface UserStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
}
