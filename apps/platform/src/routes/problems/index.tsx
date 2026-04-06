import { createFileRoute } from '@tanstack/react-router';
import { ProblemListPage } from '@/features/ProblemList/ProblemListPage';

export const Route = createFileRoute('/problems/')({
  component: ProblemListPage,
});
