import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { apiClient } from '../apiClient';

export interface SampleTestCase {
  id: string;
  input: string;
  output: string;
  order: number;
}

export function useTestCases(slug: string) {
  return useQuery({
    queryKey: queryKeys.problems.testCases(slug),
    queryFn: async () => {
      const { data } = await apiClient.get<SampleTestCase[]>(
        `/api/v1/problems/${slug}/testcases/sample`
      );
      return data;
    },
    staleTime: 10 * 60_000,
    enabled: !!slug,
  });
}
