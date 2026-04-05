import type { Metadata } from "next";
import { content } from "@/lib/content";
import { getIcon } from "@/lib/icons";
import { SectionWrapper, SectionHeading } from "@prepforall/marketing-ui/atomic";
import { CTASection } from "@prepforall/marketing-ui/organisms";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore PrepForAll's features: Monaco code editor, sandboxed execution, contests, test engine, analytics, and more.",
};

export default async function FeaturesPage() {
  const featuresData = await content.features();

  return (
    <>
      <SectionWrapper background="white">
        <SectionHeading subtitle="Everything you need to build coding excellence">
          {featuresData.heading}
        </SectionHeading>
      </SectionWrapper>

      {featuresData.features.map((feature, index) => (
        <SectionWrapper
          key={feature.title}
          background={index % 2 === 0 ? "gray" : "white"}
        >
          <div
            className={`grid items-center gap-12 lg:grid-cols-2 ${
              index % 2 === 1 ? "lg:[direction:rtl] lg:*:[direction:ltr]" : ""
            }`}
          >
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                  {getIcon(feature.iconName)}
                </div>
                <h2 className="font-heading text-2xl font-bold text-gray-900">
                  {feature.title}
                </h2>
                {feature.comingSoon && (
                  <span className="rounded-full bg-yellow-100 px-3 py-0.5 text-xs font-medium text-yellow-700">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="leading-relaxed text-gray-600">{feature.description}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={feature.screenshotSrc}
                alt={feature.title}
                width={640}
                height={400}
                className="w-full"
              />
            </div>
          </div>
        </SectionWrapper>
      ))}

      <CTASection
        heading="Ready to bring this to your classroom?"
        ctaLabel="Request a Demo"
        ctaHref="/for-universities"
      />
    </>
  );
}
