import { createFileRoute } from '@tanstack/react-router';
import { ProblemWorkspace } from '@/features/ProblemWorkspace/ProblemWorkspace';

export const Route = createFileRoute('/problems/$slug')({
  component: ProblemPage,
});

function ProblemPage() {
  const { slug } = Route.useParams();
  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <ProblemWorkspace slug={slug} />
    </div>
  );
}
