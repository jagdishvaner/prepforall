import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

interface ResetPasswordFormProps { token: string; }

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setIsSubmitting(true);
    try {
      await apiClient.post('/api/v1/auth/reset-password', { token, password });
      toast.success('Password reset successfully. Please sign in.');
      navigate({ to: '/auth/login' });
    } catch {
      toast.error('Reset failed. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-8">
      <h2 className="text-xl font-bold font-heading">Reset Password</h2>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input type="password" placeholder="New password" required value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <input type="password" placeholder="Confirm password" required value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <button type="submit" disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
