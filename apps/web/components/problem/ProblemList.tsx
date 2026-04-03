"use client";

import { useState } from "react";
import Link from "next/link";
import { useProblems } from "@/lib/hooks/useProblems";
import type { Problem } from "@/types";

const difficultyColor = {
  easy: "text-green-500",
  medium: "text-yellow-500",
  hard: "text-red-500",
};

export function ProblemList() {
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const { data: problems, isLoading } = useProblems({ difficulty, q: search });

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search problems..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="rounded border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">#</th>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Difficulty</th>
              <th className="px-4 py-3 text-left font-medium">Acceptance</th>
              <th className="px-4 py-3 text-left font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : (
              problems?.map((p: Problem, i: number) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/problems/${p.slug}`} className="font-medium hover:text-primary">
                      {p.title}
                    </Link>
                  </td>
                  <td className={`px-4 py-3 ${difficultyColor[p.difficulty]}`}>
                    {p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.acceptanceRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
