import { type ReactNode } from "react";
import { SectionWrapper } from "../atomic/SectionWrapper";
import { SectionHeading } from "../atomic/SectionHeading";
import { FeatureCard } from "../molecular/FeatureCard";

export interface OfferItem {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface OfferSectionProps {
  heading: string;
  subtitle?: string;
  offers: OfferItem[];
}

export function OfferSection({ heading, subtitle, offers }: OfferSectionProps) {
  return (
    <SectionWrapper background="white">
      <SectionHeading subtitle={subtitle}>{heading}</SectionHeading>
      <div className="grid gap-8 md:grid-cols-3">
        {offers.map((offer) => (
          <FeatureCard
            key={offer.title}
            icon={offer.icon}
            title={offer.title}
            description={offer.description}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
