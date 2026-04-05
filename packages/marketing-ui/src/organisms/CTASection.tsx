import { SectionWrapper } from "../atomic/SectionWrapper";

export interface CTASectionProps {
  heading: string;
  ctaLabel: string;
  ctaHref: string;
}

export function CTASection({ heading, ctaLabel, ctaHref }: CTASectionProps) {
  return (
    <SectionWrapper background="dark">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
          {heading}
        </h2>
        <a
          href={ctaHref}
          className="mt-8 inline-block rounded-lg bg-brand-accent px-10 py-4 text-sm font-semibold text-white transition-colors hover:bg-brand-accent/90"
        >
          {ctaLabel}
        </a>
      </div>
    </SectionWrapper>
  );
}
