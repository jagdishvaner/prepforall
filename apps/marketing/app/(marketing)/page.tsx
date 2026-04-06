import { content } from "@/lib/content";
import { getIcon } from "@/lib/icons";
import {
  HeroBlock,
  StatsSection,
  OfferSection,
  ProductPreview,
  HowItWorks,
  UniversityPartners,
  TestimonialCarousel,
  PlacementLogos,
  CTASection,
} from "@prepforall/marketing-ui/organisms";
import { SectionWrapper, SectionHeading } from "@prepforall/marketing-ui/atomic";
import Link from "next/link";

export default async function HomePage() {
  const [homepage, testimonials, universities] = await Promise.all([
    content.homepage(),
    content.testimonials(),
    content.universities(),
  ]);

  const offers = homepage.offers.map((offer) => ({
    ...offer,
    icon: getIcon(offer.iconName),
  }));

  const steps = homepage.howItWorks.steps.map((step) => ({
    ...step,
    icon: getIcon(step.iconName),
  }));

  return (
    <>
      {/* Section 1: Hero */}
      <HeroBlock {...homepage.hero} />

      {/* Section 2: Stats */}
      <StatsSection stats={homepage.stats} />

      {/* Section 3: What We Offer */}
      <OfferSection
        heading="Everything your classroom needs"
        offers={offers}
      />

      {/* Section 4: Product Preview */}
      <ProductPreview
        heading={homepage.productPreview.heading}
        tabs={homepage.productPreview.tabs}
      />

      {/* Section 5: How It Works */}
      <HowItWorks heading={homepage.howItWorks.heading} steps={steps} />

      {/* Section 6: For Universities */}
      <SectionWrapper background="gray">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading align="left">
              {homepage.forUniversities.heading}
            </SectionHeading>
            <ul className="space-y-3">
              {homepage.forUniversities.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-gray-700">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {bullet}
                </li>
              ))}
            </ul>
            <Link
              href={homepage.forUniversities.ctaHref}
              className="mt-8 inline-block text-sm font-semibold text-brand-primary"
            >
              {homepage.forUniversities.ctaLabel} &rarr;
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={homepage.forUniversities.screenshotSrc}
              alt="Trainer dashboard"
              width={640}
              height={400}
              className="w-full"
            />
          </div>
        </div>
      </SectionWrapper>

      {/* Section 7: University Partners */}
      <UniversityPartners
        heading="Trusted by universities across India"
        partners={universities.partners}
      />

      {/* Section 8: Testimonials */}
      <TestimonialCarousel
        heading={testimonials.heading}
        testimonials={testimonials.testimonials}
      />

      {/* Section 9: Placement Companies */}
      <PlacementLogos
        heading="Where our students get placed"
        companies={universities.placements}
      />

      {/* Section 10: Final CTA */}
      <CTASection {...homepage.cta} />
    </>
  );
}
