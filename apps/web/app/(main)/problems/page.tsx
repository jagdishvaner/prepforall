import { ProblemList } from "@/components/problem/ProblemList";

export default function ProblemsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Problems</h1>
        <p className="text-muted-foreground">Solve problems and improve your skills</p>
      </div>
      <ProblemList />
    </div>
  );
}
