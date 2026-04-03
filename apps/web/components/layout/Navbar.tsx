"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "next-themes";
import { Moon, Sun, User } from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, clearAuth } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <Link href="/" className="text-lg font-bold text-primary">
        PrepForAll
      </Link>

      <nav className="flex items-center gap-6 text-sm">
        <Link href="/problems" className="text-muted-foreground hover:text-foreground">
          Problems
        </Link>
        <Link href="/contests" className="text-muted-foreground hover:text-foreground">
          Contests
        </Link>
        <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground">
          Leaderboard
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded p-1.5 hover:bg-muted"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Link href={`/profile/${user?.username}`} className="flex items-center gap-1.5 text-sm">
              <User className="h-4 w-4" />
              {user?.username}
            </Link>
            <button
              onClick={clearAuth}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/login" className="rounded px-3 py-1.5 text-sm hover:bg-muted">
              Login
            </Link>
            <Link href="/register" className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
