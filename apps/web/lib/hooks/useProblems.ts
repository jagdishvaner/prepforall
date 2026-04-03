import { useQuery } from "@tanstack/react-query";
import { problemsApi, ProblemsFilter } from "@/lib/api/problems";

export const problemKeys = {
  all: ["problems"] as const,
  list: (filter: ProblemsFilter) => [...problemKeys.all, "list", filter] as const,
  detail: (slug: string) => [...problemKeys.all, "detail", slug] as const,
  testCases: (slug: string) => [...problemKeys.all, "testcases", slug] as const,
};

export function useProblems(filter: ProblemsFilter = {}) {
  return useQuery({
    queryKey: problemKeys.list(filter),
    queryFn: () => problemsApi.list(filter),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProblem(slug: string) {
  return useQuery({
    queryKey: problemKeys.detail(slug),
    queryFn: () => problemsApi.getBySlug(slug),
    staleTime: 10 * 60 * 1000,
    enabled: !!slug,
  });
}

export function useSampleTestCases(slug: string) {
  return useQuery({
    queryKey: problemKeys.testCases(slug),
    queryFn: () => problemsApi.getSampleTestCases(slug),
    staleTime: 10 * 60 * 1000,
    enabled: !!slug,
  });
}
