import { StatCard } from '@prepforall/platform-ui/molecular';
import { Users, BookOpen, BarChart2, Calendar } from 'lucide-react';

export function TrainerDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold font-heading">Trainer Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Students" value={0} icon={<Users className="h-4 w-4" />} />
        <StatCard title="Problems Assigned" value={0} icon={<BookOpen className="h-4 w-4" />} />
        <StatCard title="Avg. Completion" value="0%" icon={<BarChart2 className="h-4 w-4" />} />
        <StatCard title="Upcoming Tests" value={0} icon={<Calendar className="h-4 w-4" />} />
      </div>
      <div className="rounded-xl border border-border p-6 text-muted-foreground">
        Batch activity and student progress will appear here.
      </div>
    </div>
  );
}
