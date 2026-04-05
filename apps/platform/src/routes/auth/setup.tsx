import { createFileRoute } from '@tanstack/react-router';
import { SetupForm } from '@/features/Auth/SetupForm';

export const Route = createFileRoute('/auth/setup')({
  component: SetupPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
});

function SetupPage() {
  const { token } = Route.useSearch();

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        Invalid or missing invite token.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <SetupForm token={token} />
    </div>
  );
}
