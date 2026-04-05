import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';
import { usersApi } from '@/lib/api/users';
import { StatCard } from '@prepforall/platform-ui/molecular';
import { Code2, CheckCircle, Clock, Trophy } from 'lucide-react';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  const { data: profile } = useQuery({
    queryKey: queryKeys.users.profile(user?.username ?? ''),
    queryFn: () => usersApi.getProfile(user?.username ?? ''),
    enabled: !!user?.username,
  });

  const { data: stats } = useQuery({
    queryKey: queryKeys.users.stats(user?.username ?? ''),
    queryFn: () => usersApi.getStats(user?.username ?? ''),
    enabled: !!user?.username,
  });

  if (!user) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Not logged in.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading">{user.username}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize">
            {user.role.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Problems Solved" value={stats?.problemsSolved ?? 0} icon={<Code2 className="h-4 w-4" />} />
        <StatCard title="Acceptance Rate" value={stats?.acceptanceRate ? `${stats.acceptanceRate}%` : '0%'} icon={<CheckCircle className="h-4 w-4" />} />
        <StatCard title="Total Submissions" value={stats?.totalSubmissions ?? 0} icon={<Clock className="h-4 w-4" />} />
        <StatCard title="Contest Rating" value={stats?.contestRating ?? '-'} icon={<Trophy className="h-4 w-4" />} />
      </div>

      {/* Recent Submissions */}
      <div className="rounded-xl border border-border p-6">
        <h2 className="mb-4 text-lg font-semibold font-heading">Recent Submissions</h2>
        <p className="text-sm text-muted-foreground">Submission history will appear here once you start solving problems.</p>
      </div>
    </div>
  );
}
