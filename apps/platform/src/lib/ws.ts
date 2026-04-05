import { useAuthStore } from '../stores/authStore';

const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`;

export function createSubmissionSocket(
  submissionId: string,
  onMessage: (data: unknown) => void,
  onError?: (err: Event) => void
): () => void {
  const token = useAuthStore.getState().accessToken;
  const ws = new WebSocket(`${WS_BASE}/ws?submission_id=${submissionId}&token=${encodeURIComponent(token || '')}`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch { /* ignore malformed */ }
  };

  ws.onerror = (e) => onError?.(e);

  return () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };
}
