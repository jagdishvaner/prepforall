import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/auth/oauth-callback')({
  component: OAuthCallback,
});

function OAuthCallback() {
  useEffect(() => {
    // Parse token from URL fragment (hash) to avoid logging in browser history/server logs
    // Backend redirects with: /auth/oauth-callback#access_token=xxx
    // Fallback to query params for backwards compatibility
    const params = new URLSearchParams(window.location.hash.replace('#', ''));
    let accessToken = params.get('access_token') || '';
    let error = params.get('error') || '';

    if (!accessToken && !error) {
      const searchParams = new URLSearchParams(window.location.search);
      accessToken = searchParams.get('access_token') || '';
      error = searchParams.get('error') || '';
    }

    if (window.opener) {
      window.opener.postMessage(
        { type: 'oauth_callback', access_token: accessToken, error },
        window.location.origin
      );
      window.close();
    }
  }, []);

  return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      Completing login...
    </div>
  );
}
