import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/setup')({
  component: SetupPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
});

function SetupPage() {
  const { token } = Route.useSearch();
  return <div className="flex h-screen items-center justify-center">Setup page for token: {token}</div>;
}
