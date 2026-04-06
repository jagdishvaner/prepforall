import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProblemBySlug, getAllProblemSlugs } from "@/lib/api";
import { SectionWrapper } from "@prepforall/marketing-ui/atomic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllProblemSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const problem = await getProblemBySlug(slug);
  if (!problem) return {};

  const description = problem.description
    ? problem.description.slice(0, 150) + "..."
    : `Solve ${problem.title} on PrepForAll`;

  return {
    title: problem.title,
    description,
    openGraph: {
      title: `${problem.title} - PrepForAll`,
      description,
      url: `https://prepforall.com/problems/${slug}`,
    },
    alternates: {
      canonical: `https://prepforall.com/problems/${slug}`,
    },
  };
}

const difficultyColors = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

export default async function ProblemPage({ params }: Props) {
  const { slug } = await params;
  const problem = await getProblemBySlug(slug);
  if (!problem) notFound();

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: problem.title,
    description: problem.description,
    educationalLevel: problem.difficulty,
    about: problem.tags,
    provider: {
      "@type": "Organization",
      name: "PrepForAll",
      url: "https://prepforall.com",
    },
    url: `https://prepforall.com/problems/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SectionWrapper background="white" className="!py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
          {/* Problem content */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <h1 className="font-heading text-3xl font-bold text-gray-900">
                {problem.title}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  difficultyColors[problem.difficulty]
                }`}
              >
                {problem.difficulty.charAt(0).toUpperCase() +
                  problem.difficulty.slice(1)}
              </span>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose prose-gray max-w-none">
              <div dangerouslySetInnerHTML={{ __html: problem.description }} />
            </div>

            <div className="mt-8">
              <Link
                href={`${process.env.NEXT_PUBLIC_PLATFORM_URL || "https://app.prepforall.com"}/problems/${slug}`}
                className="inline-block rounded-lg bg-brand-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
              >
                Login to Start Coding
              </Link>
            </div>
          </div>

          {/* Sidebar meta */}
          <div className="rounded-xl border border-gray-200 p-6">
            <h2 className="mb-4 font-semibold text-gray-900">Problem Info</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-gray-500">Acceptance Rate</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {(problem.acceptance_rate * 100).toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Total Submissions</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {problem.total_submissions.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Time Limit</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {problem.time_limit_ms}ms
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Memory Limit</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {problem.memory_limit_mb}MB
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
