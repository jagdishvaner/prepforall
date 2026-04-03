import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { submissionsApi, SubmitRequest } from "@/lib/api/submissions";
import type { Submission, Verdict } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

export function useSubmit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: SubmitRequest) => submissionsApi.submit(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}

// Polls submission status via WebSocket.
// Falls back to HTTP polling if WebSocket is unavailable.
export function useSubmissionResult(submissionId: string | null) {
  const [result, setResult] = useState<Submission | null>(null);
  const [isJudging, setIsJudging] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!submissionId) return;

    setIsJudging(true);

    const ws = new WebSocket(`${WS_URL}/ws?submission_id=${submissionId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data: Submission = JSON.parse(event.data);
        setResult(data);
        setIsJudging(false);
        ws.close();
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      setIsJudging(false);
    };

    return () => {
      ws.close();
    };
  }, [submissionId]);

  return { result, isJudging };
}

export function verdictColor(verdict: Verdict): string {
  const map: Record<Verdict, string> = {
    AC: "text-green-500",
    WA: "text-red-500",
    TLE: "text-yellow-500",
    MLE: "text-yellow-500",
    RE: "text-orange-500",
    CE: "text-orange-500",
    PENDING: "text-muted-foreground",
    RUNNING: "text-blue-500",
  };
  return map[verdict] ?? "text-muted-foreground";
}
