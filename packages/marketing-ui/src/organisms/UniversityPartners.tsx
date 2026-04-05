"use client";

import { SectionWrapper } from "../atomic/SectionWrapper";
import { SectionHeading } from "../atomic/SectionHeading";
import { BrandLogo } from "../atomic/BrandLogo";

export interface Partner {
  name: string;
  logoSrc: string;
}

export interface UniversityPartnersProps {
  heading: string;
  partners: Partner[];
}

export function UniversityPartners({ heading, partners }: UniversityPartnersProps) {
  // Double the array for infinite scroll effect
  const doubled = [...partners, ...partners];

  return (
    <SectionWrapper background="cream">
      <SectionHeading>{heading}</SectionHeading>
      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-surface-cream to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-surface-cream to-transparent" />
        <div className="flex animate-scroll gap-16 py-4">
          {doubled.map((partner, index) => (
            <BrandLogo
              key={`${partner.name}-${index}`}
              src={partner.logoSrc}
              alt={partner.name}
              className="flex-shrink-0 opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0"
            />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
