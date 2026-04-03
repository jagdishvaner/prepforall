"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, Trophy, BarChart2, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/problems", icon: Code2, label: "Problems" },
  { href: "/contests", icon: Trophy, label: "Contests" },
  { href: "/leaderboard", icon: BarChart2, label: "Leaderboard" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-14 flex-shrink-0 flex-col items-center border-r border-border py-4 lg:flex">
      {navItems.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          title={label}
          className={cn(
            "mb-1 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted",
            pathname.startsWith(href) && "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </Link>
      ))}
    </aside>
  );
}
