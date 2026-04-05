import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});

function LoginPage() {
  return <div className="flex h-screen items-center justify-center">Login page placeholder</div>;
}
