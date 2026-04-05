import type { Metadata } from "next";
import { content } from "@/lib/content";
import { SectionWrapper, SectionHeading } from "@prepforall/marketing-ui/atomic";
import { PricingBlock } from "@prepforall/marketing-ui/organisms";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for institutions. Choose the plan that fits your university.",
};

export default async function PricingPage() {
  const [pricingData, faqData] = await Promise.all([
    content.pricing(),
    content.faq(),
  ]);

  return (
    <>
      <PricingBlock
        heading={pricingData.heading}
        subtitle={pricingData.subtitle}
        tiers={pricingData.tiers}
      />

      {/* FAQ Accordion */}
      <SectionWrapper background="gray">
        <SectionHeading>Frequently Asked Questions</SectionHeading>
        <div className="mx-auto max-w-3xl space-y-4">
          {faqData.items.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-gray-200 bg-white"
            >
              <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-gray-900">
                {item.question}
                <svg
                  className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="border-t border-gray-100 px-6 py-4 text-sm text-gray-600">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </SectionWrapper>
    </>
  );
}
