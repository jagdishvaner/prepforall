import { createFileRoute } from '@tanstack/react-router';
import { ForgotPasswordForm } from '@/features/Auth/ForgotPasswordForm';

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <ForgotPasswordForm />
    </div>
  );
}
