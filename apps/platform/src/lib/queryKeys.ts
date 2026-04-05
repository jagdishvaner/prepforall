export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  problems: {
    all: ['problems'] as const,
    list: (filter: Record<string, unknown>) => [...queryKeys.problems.all, 'list', filter] as const,
    detail: (slug: string) => [...queryKeys.problems.all, 'detail', slug] as const,
    testCases: (slug: string) => [...queryKeys.problems.all, 'testcases', slug] as const,
  },
  submissions: {
    all: ['submissions'] as const,
    byProblem: (slug: string) => [...queryKeys.submissions.all, 'problem', slug] as const,
    detail: (id: string) => [...queryKeys.submissions.all, 'detail', id] as const,
  },
  users: {
    profile: (username: string) => ['users', 'profile', username] as const,
    stats: (username: string) => ['users', 'stats', username] as const,
  },
  dashboard: {
    stats: (role: string) => ['dashboard', 'stats', role] as const,
  },
} as const;
