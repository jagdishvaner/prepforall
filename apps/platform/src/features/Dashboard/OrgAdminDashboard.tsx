import { StatCard } from '@prepforall/platform-ui/molecular';
import { Building2, Users, GraduationCap, TrendingUp } from 'lucide-react';

export function OrgAdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold font-heading">Organization Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Members" value={0} icon={<Users className="h-4 w-4" />} />
        <StatCard title="Active Batches" value={0} icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard title="Trainers" value={0} icon={<Building2 className="h-4 w-4" />} />
        <StatCard title="Overall Progress" value="0%" icon={<TrendingUp className="h-4 w-4" />} />
      </div>
      <div className="rounded-xl border border-border p-6 text-muted-foreground">
        Organization-wide analytics and member management will appear here.
      </div>
    </div>
  );
}
