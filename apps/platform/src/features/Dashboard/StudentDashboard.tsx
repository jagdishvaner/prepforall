import { StatCard } from '@prepforall/platform-ui/molecular';
import { Code2, Clock, Trophy, Target, ArrowRight, BookOpen, ClipboardList, Layers, CheckCircle2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

const ENROLLED_COURSES = [
  {
    id: 'dsa-fundamentals',
    title: 'DSA Fundamentals',
    description: 'Master arrays, strings, linked lists, trees, graphs, and dynamic programming with 120+ curated problems.',
    topics: 8,
    problems: 120,
    completedProblems: 0,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-500/10',
    textColor: 'text-blue-500',
    modules: [
      { name: 'Arrays & Strings', problems: 25, completed: 0 },
      { name: 'Linked Lists', problems: 15, completed: 0 },
      { name: 'Stacks & Queues', problems: 12, completed: 0 },
      { name: 'Trees & BST', problems: 18, completed: 0 },
      { name: 'Graphs', problems: 16, completed: 0 },
      { name: 'Dynamic Programming', problems: 20, completed: 0 },
      { name: 'Sorting & Searching', problems: 8, completed: 0 },
      { name: 'Greedy & Backtracking', problems: 6, completed: 0 },
    ],
  },
];

export function StudentDashboard() {
  const navigate = useNavigate();

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

      {/* My Courses */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">My Courses</h2>
        <div className="space-y-4">
          {ENROLLED_COURSES.map((course) => {
            const progress = course.problems > 0
              ? Math.round((course.completedProblems / course.problems) * 100)
              : 0;

            return (
              <div
                key={course.id}
                className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md"
              >
                {/* Course header */}
                <button
                  onClick={() => navigate({ to: '/problems' })}
                  className="flex w-full items-start gap-4 p-6 text-left"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${course.lightColor} ${course.textColor}`}>
                    <Layers className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{course.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{course.description}</p>
                      </div>
                      <span className="ml-4 shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {course.topics} topics &middot; {course.problems} problems
                      </span>
                    </div>
                    {/* Overall progress bar */}
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="font-medium">{progress}% &middot; {course.completedProblems}/{course.problems} solved</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${course.color} transition-all`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Module breakdown */}
                <div className="border-t border-border bg-muted/30 px-6 py-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {course.modules.map((mod) => (
                      <button
                        key={mod.name}
                        onClick={() => navigate({ to: '/problems' })}
                        className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-all hover:border-primary/30 hover:shadow-sm"
                      >
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${mod.completed === mod.problems ? 'text-green-500' : 'text-muted-foreground/40'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{mod.name}</p>
                          <p className="text-xs text-muted-foreground">{mod.completed}/{mod.problems}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
