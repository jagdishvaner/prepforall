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
