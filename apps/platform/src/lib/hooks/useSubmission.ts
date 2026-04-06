import { useState, useCallback } from 'react';
import { submissionsApi } from '../api/submissions';
import { useSubmissionResult } from './useSubmissionResult';
import { toast } from 'sonner';

export type ExecutionMode = 'run' | 'submit' | null;

export function useSubmission(slug: string) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<ExecutionMode>(null);
  const { result, isJudging } = useSubmissionResult(activeId);

  const run = useCallback(
    async (code: string, language: string) => {
      if (!code.trim()) {
        toast.error('Please write some code first');
        return;
      }
      try {
        const { run_id } = await submissionsApi.run({
          problemSlug: slug,
          language,
          code,
        });
        setMode('run');
        setActiveId(run_id);
      } catch {
        toast.error('Failed to run code. Please try again.');
      }
    },
    [slug]
  );

  const submit = useCallback(
    async (code: string, language: string) => {
      if (!code.trim()) {
        toast.error('Please write some code first');
        return;
      }
      try {
        const data = await submissionsApi.submit({
          problemSlug: slug,
          language,
          code,
        });
        setMode('submit');
        setActiveId(data.id);
      } catch {
        toast.error('Failed to submit code. Please try again.');
      }
    },
    [slug]
  );

  return { run, submit, result, isJudging, mode };
}
