import type { Metadata } from "next";
import { content } from "@/lib/content";
import { getIcon } from "@/lib/icons";
import {
  SectionWrapper,
  SectionHeading,
} from "@prepforall/marketing-ui/atomic";
import {
  HowItWorks,
  UniversityPartners,
} from "@prepforall/marketing-ui/organisms";
import { DemoForm } from "./DemoForm";

export const metadata: Metadata = {
  title: "For Universities",
  description:
    "Partner with PrepForAll for coding training, assessments, and placement preparation. Request a demo today.",
};

export default async function ForUniversitiesPage() {
  const [homepage, universities] = await Promise.all([
    content.homepage(),
    content.universities(),
  ]);

  const steps = homepage.howItWorks.steps.map((step) => ({
    ...step,
    icon: getIcon(step.iconName),
  }));

  const deliverables = [
    {
      title: "Coding Platform",
      description:
        "200+ DSA & SQL problems, LeetCode-grade editor, 6 languages supported.",
      screenshotSrc: "/images/features/editor.png",
    },
    {
      title: "Test & Assessment Engine",
      description:
        "Timed tests, batch assignment, company-specific prep (TCS, Infosys, Cognizant).",
      screenshotSrc: "/images/features/tests.png",
    },
    {
      title: "Analytics Dashboard",
      description:
        "Student progress, batch reports, at-risk flags, NAAC/NIRF exports.",
      screenshotSrc: "/images/features/analytics.png",
    },
  ];

  const inclusions = [
    "Full platform access for trainers and students",
    "Trainer onboarding session",
    "Co-branded certificates",
    "Pre-built test templates",
    "Exportable NAAC/NIRF reports",
    "Priority support from our team",
  ];

  return (
    <>
      {/* Hero */}
      <SectionWrapper background="white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-4xl font-bold text-gray-900 md:text-5xl">
            Partner with PrepForAll
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            Equip your students with industry-grade coding practice, timed
            assessments, and analytics that impress accreditation bodies.
          </p>
          <a
            href="#demo-form"
            className="mt-8 inline-block rounded-lg bg-brand-primary px-8 py-3 text-sm font-semibold text-white"
          >
            Request a Demo &darr;
          </a>
        </div>
      </SectionWrapper>

      {/* What We Deliver */}
      {deliverables.map((item, index) => (
        <SectionWrapper
          key={item.title}
          background={index % 2 === 0 ? "gray" : "white"}
        >
          <div
            className={`grid items-center gap-12 lg:grid-cols-2 ${
              index % 2 === 1 ? "lg:[direction:rtl] lg:*:[direction:ltr]" : ""
            }`}
          >
            <div>
              <h2 className="font-heading text-2xl font-bold text-gray-900">
                {item.title}
              </h2>
              <p className="mt-4 text-gray-600">{item.description}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.screenshotSrc}
                alt={item.title}
                width={640}
                height={400}
                className="w-full"
              />
            </div>
          </div>
        </SectionWrapper>
      ))}

      {/* How It Works */}
      <HowItWorks heading="How it works" steps={steps} />

      {/* What's Included */}
      <SectionWrapper background="gray">
        <SectionHeading>What&apos;s included</SectionHeading>
        <div className="mx-auto grid max-w-2xl gap-4">
          {inclusions.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* University Partners */}
      <UniversityPartners
        heading="Trusted by universities across India"
        partners={universities.partners}
      />

      {/* Request a Demo Form */}
      <SectionWrapper background="white" id="demo-form">
        <SectionHeading subtitle="Fill out the form and we'll get back to you within 24 hours.">
          Request a Demo
        </SectionHeading>
        <div className="mx-auto max-w-lg">
          <DemoForm />
        </div>
      </SectionWrapper>
    </>
  );
}
