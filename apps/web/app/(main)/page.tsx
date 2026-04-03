import Link from "next/link";
import { Code2, Trophy, BarChart2, Zap, Shield, Globe } from "lucide-react";

const stats = [
  { label: "Problems", value: "500+", icon: Code2 },
  { label: "Contests Held", value: "120+", icon: Trophy },
  { label: "Active Users", value: "10K+", icon: Globe },
];

const features = [
  {
    icon: Zap,
    title: "Real-time Judging",
    description:
      "Get your verdict in under 3 seconds. Our sandboxed judge runs your code instantly with live WebSocket feedback.",
  },
  {
    icon: Shield,
    title: "Secure Sandbox",
    description:
      "Every submission runs in a gVisor-isolated Docker container with zero network access and hard resource limits.",
  },
  {
    icon: Trophy,
    title: "Rated Contests",
    description:
      "Compete in ICPC and IOI-style contests. Your rating updates live on the leaderboard as results come in.",
  },
  {
    icon: Code2,
    title: "6 Languages",
    description:
      "Submit in C++, C, Java, Python 3, JavaScript, or Go. Monaco editor with syntax highlighting and autocomplete.",
  },
];

const difficulties = [
  { label: "Easy", count: "180", color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" },
  { label: "Medium", count: "220", color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { label: "Hard", count: "100", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
];

export default function HomePage() {
  return (
    <div className="min-h-full">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Judge system online
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Level up your{" "}
            <span className="text-primary">coding skills</span>
            <br />
            with PrepForAll
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Practice algorithmic problems, compete in rated contests, and track your growth —
            all in one platform built for serious programmers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/problems"
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Solving
            </Link>
            <Link
              href="/contests"
              className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              View Contests
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border px-6 py-10">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-6 text-center">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <Icon className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem difficulty split */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center text-xl font-semibold">Problems by Difficulty</h2>
          <div className="grid grid-cols-3 gap-4">
            {difficulties.map(({ label, count, color, bg }) => (
              <Link
                key={label}
                href={`/problems?difficulty=${label.toLowerCase()}`}
                className={`rounded-xl border p-6 text-center transition-colors hover:opacity-90 ${bg}`}
              >
                <p className={`text-3xl font-bold ${color}`}>{count}</p>
                <p className={`mt-1 text-sm font-medium ${color}`}>{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/20 px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-xl font-semibold">
            Everything you need to compete
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-background p-6"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1.5 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-6 py-14 text-center">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-3 text-xl font-semibold">Ready to start?</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Join thousands of developers sharpening their skills on PrepForAll.
          </p>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
