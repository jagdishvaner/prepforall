import { ProblemWorkspace } from "@/components/problem/ProblemWorkspace";

interface Props {
  params: { slug: string };
}

export default function ProblemPage({ params }: Props) {
  return <ProblemWorkspace slug={params.slug} />;
}
