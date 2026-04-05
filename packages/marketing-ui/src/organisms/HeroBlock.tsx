/* eslint-disable @next/next/no-img-element */

import { SectionWrapper } from "../atomic/SectionWrapper";

export interface HeroBlockProps {
  heading: string;
  subtext: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  screenshotSrc: string;
  screenshotAlt: string;
}

export function HeroBlock({
  heading,
  subtext,
  primaryCta,
  secondaryCta,
  screenshotSrc,
  screenshotAlt,
}: HeroBlockProps) {
  return (
    <SectionWrapper background="white">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
            {heading}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">{subtext}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={primaryCta.href}
              className="rounded-lg bg-brand-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
            >
              {primaryCta.label}
            </a>
            <a
              href={secondaryCta.href}
              className="text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary/80"
            >
              {secondaryCta.label} &rarr;
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-2xl">
            <img
              src={screenshotSrc}
              alt={screenshotAlt}
              width={640}
              height={400}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
