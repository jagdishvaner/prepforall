import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { openOAuthPopup } from './OAuthPopup';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

interface SetupFormProps {
  token: string;
}

export function SetupForm({ token }: SetupFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await apiClient.post('/api/v1/auth/setup', {
        token, username, password,
      });
      setAuth(data.access_token);
      toast.success('Account activated! Welcome to PrepForAll.');
      navigate({ to: '/dashboard' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Setup failed. Your invite may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthSetup = async (provider: 'google' | 'github') => {
    try {
      // OAuth setup links the invite token with the OAuth account
      const accessToken = await openOAuthPopup(provider);
      // After OAuth, complete setup by linking invite
      await apiClient.post('/api/v1/auth/setup-oauth', { token, provider });
      setAuth(accessToken);
      toast.success('Account activated!');
      navigate({ to: '/dashboard' });
    } catch (err) {
      if (err instanceof Error && err.message !== 'Login cancelled') {
        toast.error(err.message);
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-8 shadow-lg">
      <h1 className="text-2xl font-bold font-heading">Set Up Your Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You have been invited to PrepForAll. Choose how you would like to sign in.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={() => handleOAuthSetup('google')}
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
        >
          Link Google Account
        </button>
        <button
          onClick={() => handleOAuthSetup('github')}
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
        >
          Link GitHub Account
        </button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">OR set a password</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text" placeholder="Choose a username" required
          value={username} onChange={(e) => setUsername(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password" placeholder="Password (min 8 characters)" required
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password" placeholder="Confirm password" required
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit" disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Activating...' : 'Activate Account'}
        </button>
      </form>
    </div>
  );
}
