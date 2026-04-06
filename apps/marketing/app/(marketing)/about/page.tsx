import type { Metadata } from "next";
import { SectionWrapper, SectionHeading } from "@prepforall/marketing-ui/atomic";
import { FeatureCard } from "@prepforall/marketing-ui/molecular";
import { CTASection } from "@prepforall/marketing-ui/organisms";
import { getIcon } from "@/lib/icons";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about PrepForAll's mission to bridge the academia-industry gap in CS education.",
};

const values = [
  {
    iconName: "Shield",
    title: "Quality",
    description: "Every problem, feature, and integration meets the standard we'd want for ourselves.",
  },
  {
    iconName: "Users",
    title: "Transparency",
    description: "Simple pricing, honest partnerships, and clear communication with every stakeholder.",
  },
  {
    iconName: "GraduationCap",
    title: "Student-first",
    description: "Every decision starts with 'How does this help the student succeed?'",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <SectionWrapper background="white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-4xl font-bold text-gray-900 md:text-5xl">
            We&apos;re building the platform we wish we had in college.
          </h1>
        </div>
      </SectionWrapper>

      {/* Story */}
      <SectionWrapper background="gray">
        <SectionHeading>Our Story</SectionHeading>
        <div className="prose prose-gray mx-auto max-w-3xl">
          <p>
            PrepForAll started from a simple observation: universities across India
            lack access to production-quality coding practice tools. While platforms
            like LeetCode serve individual learners, there was nothing purpose-built
            for the university training workflow.
          </p>
          <p>
            We set out to build a platform that gives training partners and
            universities the same caliber of tools that top tech companies use for
            hiring -- but designed around the classroom, not the individual.
          </p>
          <p>
            Today, PrepForAll powers coding training across multiple universities and
            training partners, helping hundreds of students prepare for placements
            with confidence.
          </p>
        </div>
      </SectionWrapper>

      {/* Mission */}
      <SectionWrapper background="white">
        <SectionHeading subtitle="Bridging the academia-industry gap in CS education.">
          Our Mission
        </SectionHeading>
      </SectionWrapper>

      {/* Values */}
      <SectionWrapper background="gray">
        <SectionHeading>Our Values</SectionHeading>
        <div className="grid gap-8 md:grid-cols-3">
          {values.map((value) => (
            <FeatureCard
              key={value.title}
              icon={getIcon(value.iconName)}
              title={value.title}
              description={value.description}
            />
          ))}
        </div>
      </SectionWrapper>

      <CTASection
        heading="Want to work with us?"
        ctaLabel="Contact Us"
        ctaHref="/contact"
      />
    </>
  );
}
