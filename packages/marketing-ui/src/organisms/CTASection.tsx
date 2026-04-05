import { SectionWrapper } from "../atomic/SectionWrapper";

export interface CTASectionProps {
  heading: string;
  ctaLabel: string;
  ctaHref: string;
}

export function CTASection({ heading, ctaLabel, ctaHref }: CTASectionProps) {
  return (
    <SectionWrapper background="brand-dark">
      <div className="text-center">
        <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
          {heading}
        </h2>
        <a
          href={ctaHref}
          className="mt-10 inline-block rounded-lg bg-brand-primary px-10 py-4 text-base font-medium text-white transition-all hover:brightness-110"
        >
          {ctaLabel}
        </a>
      </div>
    </SectionWrapper>
  );
}
