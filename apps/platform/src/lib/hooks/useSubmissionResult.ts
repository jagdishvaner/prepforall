import { useEffect, useState } from 'react';
import { createSubmissionSocket } from '../ws';
import type { SubmissionResult } from '@/features/ProblemWorkspace/TestCasePanel';

export function useSubmissionResult(submissionId: string | null) {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isJudging, setIsJudging] = useState(false);

  useEffect(() => {
    if (!submissionId) return;
    setIsJudging(true);
    setResult(null);

    const cleanup = createSubmissionSocket(
      submissionId,
      (data) => {
        setResult(data as SubmissionResult);
        setIsJudging(false);
      },
      () => setIsJudging(false)
    );

    return cleanup;
  }, [submissionId]);

  return { result, isJudging };
}
