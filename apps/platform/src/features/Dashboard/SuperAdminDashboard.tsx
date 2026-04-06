import { StatCard } from '@prepforall/platform-ui/molecular';
import { Globe, Building2, Users, Server } from 'lucide-react';

export function SuperAdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold font-heading">Super Admin Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Organizations" value={0} icon={<Building2 className="h-4 w-4" />} />
        <StatCard title="Total Users" value={0} icon={<Users className="h-4 w-4" />} />
        <StatCard title="Total Problems" value={0} icon={<Globe className="h-4 w-4" />} />
        <StatCard title="Judge Status" value="OK" variant="success" icon={<Server className="h-4 w-4" />} />
      </div>
      <div className="rounded-xl border border-border p-6 text-muted-foreground">
        Platform-wide metrics and system health will appear here.
      </div>
    </div>
  );
}
