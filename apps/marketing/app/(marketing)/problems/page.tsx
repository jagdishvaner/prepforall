import type { Metadata } from "next";
import Link from "next/link";
import { getProblems } from "@/lib/api";
import { SectionWrapper, SectionHeading } from "@prepforall/marketing-ui/atomic";
import { CTASection } from "@prepforall/marketing-ui/organisms";

export const metadata: Metadata = {
  title: "Problem Archive",
  description:
    "Browse 200+ coding problems across DSA and SQL. Practice with PrepForAll's curated problem set.",
};

const difficultyColors = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

interface Props {
  searchParams: Promise<{ page?: string; difficulty?: string; q?: string }>;
}

export default async function ProblemsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const problems = await getProblems({
    page,
    difficulty: params.difficulty,
    q: params.q,
  });

  return (
    <>
      <SectionWrapper background="white" className="!py-12">
        <SectionHeading subtitle="Browse our curated set of DSA and SQL problems">
          Problem Archive
        </SectionHeading>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {["All", "DSA", "SQL"].map((tab) => (
            <Link
              key={tab}
              href={tab === "All" ? "/problems" : `/problems?type=${tab.toLowerCase()}`}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
            >
              {tab}
            </Link>
          ))}
          <div className="ml-auto flex gap-2">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <Link
                key={d}
                href={`/problems?difficulty=${d}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${difficultyColors[d]}`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Link>
            ))}
          </div>
        </div>

        {/* Problem table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500">#</th>
                <th className="px-6 py-3 font-medium text-gray-500">Title</th>
                <th className="px-6 py-3 font-medium text-gray-500">Difficulty</th>
                <th className="px-6 py-3 font-medium text-gray-500">Tags</th>
                <th className="px-6 py-3 font-medium text-gray-500">Acceptance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {problems.map((problem, index) => (
                <tr key={problem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">
                    {(page - 1) * 20 + index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="font-medium text-gray-900 hover:text-brand-primary"
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        difficultyColors[problem.difficulty]
                      }`}
                    >
                      {problem.difficulty.charAt(0).toUpperCase() +
                        problem.difficulty.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {(problem.acceptance_rate * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              {problems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No problems found. The API may be unavailable.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/problems?page=${page - 1}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              Previous
            </Link>
          )}
          {problems.length === 20 && (
            <Link
              href={`/problems?page=${page + 1}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              Next
            </Link>
          )}
        </div>
      </SectionWrapper>

      <CTASection
        heading="Want to solve these problems? Get access through your university."
        ctaLabel="Request a Demo"
        ctaHref="/for-universities"
      />
    </>
  );
}
