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
    <SectionWrapper background="white">
      <SectionHeading>{heading}</SectionHeading>
      <div className="relative overflow-hidden">
        <div className="flex animate-scroll gap-12">
          {doubled.map((partner, index) => (
            <BrandLogo
              key={`${partner.name}-${index}`}
              src={partner.logoSrc}
              alt={partner.name}
              className="flex-shrink-0"
            />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
