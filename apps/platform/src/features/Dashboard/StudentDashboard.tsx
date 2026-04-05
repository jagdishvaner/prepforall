import { StatCard } from '@prepforall/platform-ui/molecular';
import { Code2, Clock, Trophy, Target } from 'lucide-react';

export function StudentDashboard() {
  // TODO: wire up TanStack Query for actual data
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Problems Solved" value={0} icon={<Code2 className="h-4 w-4" />} />
        <StatCard title="Tests Pending" value={0} icon={<Clock className="h-4 w-4" />} />
        <StatCard title="Contests Upcoming" value={0} icon={<Trophy className="h-4 w-4" />} />
        <StatCard title="Acceptance Rate" value="0%" icon={<Target className="h-4 w-4" />} />
      </div>
      <div className="rounded-xl border border-border p-6 text-muted-foreground">
        Recent activity feed will appear here.
      </div>
    </div>
  );
}
