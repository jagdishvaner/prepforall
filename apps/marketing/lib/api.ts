const API_URL = process.env.API_URL || "http://localhost:8080";

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  time_limit_ms: number;
  memory_limit_mb: number;
  acceptance_rate: number;
  total_submissions: number;
  is_public: boolean;
  created_at: string;
}

export async function getProblems(params?: {
  page?: number;
  difficulty?: string;
  q?: string;
}): Promise<Problem[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.difficulty) searchParams.set("difficulty", params.difficulty);
  if (params?.q) searchParams.set("q", params.q);

  try {
    const res = await fetch(`${API_URL}/api/v1/problems?${searchParams}`, {
      next: { revalidate: 3600 }, // ISR: revalidate every hour
    });

    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getProblemBySlug(slug: string): Promise<Problem | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/problems/${slug}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getAllProblemSlugs(): Promise<string[]> {
  try {
    const problems = await getProblems({ page: 1 });
    // In production, implement pagination to fetch all slugs
    return problems.map((p) => p.slug);
  } catch {
    return [];
  }
}
