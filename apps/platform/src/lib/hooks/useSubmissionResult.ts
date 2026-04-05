import { useEffect, useState } from 'react';
import { createSubmissionSocket } from '../ws';

interface SubmissionResult {
  id: string;
  verdict: string;
  runtimeMs?: number;
  memoryKb?: number;
  passedCases: number;
  totalCases: number;
  errorMsg?: string;
}

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
