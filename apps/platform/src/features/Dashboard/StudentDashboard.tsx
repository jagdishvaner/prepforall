import { StatCard } from '@prepforall/platform-ui/molecular';
import { Code2, Clock, Trophy, Target, ArrowRight, BookOpen, ClipboardList, BarChart2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export function StudentDashboard() {
  const navigate = useNavigate();

  // TODO: wire up TanStack Query for actual data
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back! Here&apos;s your progress overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Problems Solved" value={0} icon={<Code2 className="h-4 w-4" />} />
        <StatCard title="Tests Pending" value={0} icon={<Clock className="h-4 w-4" />} />
        <StatCard title="Contests Upcoming" value={0} icon={<Trophy className="h-4 w-4" />} />
        <StatCard title="Acceptance Rate" value="0%" icon={<Target className="h-4 w-4" />} />
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <button
          onClick={() => navigate({ to: '/problems' })}
          className="group flex items-start gap-4 rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Practice Problems</h3>
            <p className="mt-1 text-sm text-muted-foreground">200+ DSA & SQL problems with real code execution</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              Start Practicing <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </button>

        <button
          onClick={() => navigate({ to: '/tests' })}
          className="group flex items-start gap-4 rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">My Tests</h3>
            <p className="mt-1 text-sm text-muted-foreground">View assigned tests and track your submissions</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              View Tests <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </button>

        <button
          onClick={() => navigate({ to: '/contests' })}
          className="group flex items-start gap-4 rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <Trophy className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Contests</h3>
            <p className="mt-1 text-sm text-muted-foreground">Compete in rated contests and climb the leaderboard</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              View Contests <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </button>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Code2 className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">No recent activity</p>
            <p className="mt-1 text-xs">Start solving problems to see your activity here</p>
          </div>
        </div>

        {/* Skill Progress */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Skill Progress</h2>
            <button
              onClick={() => navigate({ to: '/profile' })}
              className="text-xs font-medium text-primary hover:underline"
            >
              View Full Stats
            </button>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Arrays & Strings', solved: 0, total: 45, color: 'bg-blue-500' },
              { label: 'Trees & Graphs', solved: 0, total: 35, color: 'bg-green-500' },
              { label: 'Dynamic Programming', solved: 0, total: 30, color: 'bg-purple-500' },
              { label: 'SQL Queries', solved: 0, total: 25, color: 'bg-orange-500' },
            ].map((topic) => (
              <div key={topic.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>{topic.label}</span>
                  <span className="text-muted-foreground">{topic.solved}/{topic.total}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${topic.color} transition-all`}
                    style={{ width: topic.total > 0 ? `${(topic.solved / topic.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
