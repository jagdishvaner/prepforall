import { SectionWrapper } from "../atomic/SectionWrapper";
import { SectionHeading } from "../atomic/SectionHeading";
import { BrandLogo } from "../atomic/BrandLogo";

export interface PlacementCompany {
  name: string;
  logoSrc: string;
}

export interface PlacementLogosProps {
  heading: string;
  companies: PlacementCompany[];
}

export function PlacementLogos({ heading, companies }: PlacementLogosProps) {
  return (
    <SectionWrapper background="white">
      <SectionHeading>{heading}</SectionHeading>
      <div className="grid grid-cols-3 gap-8 md:grid-cols-5">
        {companies.map((company) => (
          <BrandLogo
            key={company.name}
            src={company.logoSrc}
            alt={company.name}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
