import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/auth/oauth-callback')({
  component: OAuthCallback,
  validateSearch: (search: Record<string, unknown>) => ({
    access_token: (search.access_token as string) || '',
    error: (search.error as string) || '',
  }),
});

function OAuthCallback() {
  const { access_token, error } = Route.useSearch();

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage(
        { type: 'oauth_callback', access_token, error },
        window.location.origin
      );
      window.close();
    }
  }, [access_token, error]);

  return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      Completing login...
    </div>
  );
}
