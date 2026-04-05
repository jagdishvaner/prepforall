import { SectionWrapper } from "../atomic/SectionWrapper";
import { SectionHeading } from "../atomic/SectionHeading";
import { PricingCard, type PricingCardProps } from "../molecular/PricingCard";

export interface PricingBlockProps {
  heading: string;
  subtitle?: string;
  tiers: PricingCardProps[];
}

export function PricingBlock({ heading, subtitle, tiers }: PricingBlockProps) {
  return (
    <SectionWrapper background="white">
      <SectionHeading subtitle={subtitle}>{heading}</SectionHeading>
      <div className="grid gap-8 md:grid-cols-3">
        {tiers.map((tier) => (
          <PricingCard key={tier.tier} {...tier} />
        ))}
      </div>
    </SectionWrapper>
  );
}
