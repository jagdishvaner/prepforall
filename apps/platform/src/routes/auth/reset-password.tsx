import { createFileRoute } from '@tanstack/react-router';
import { ResetPasswordForm } from '@/features/Auth/ResetPasswordForm';

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        Invalid or missing reset token.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <ResetPasswordForm token={token} />
    </div>
  );
}
