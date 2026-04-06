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
      <div className="grid grid-cols-3 gap-6 md:grid-cols-5">
        {companies.map((company) => (
          <div
            key={company.name}
            className="flex items-center justify-center rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <BrandLogo
              src={company.logoSrc}
              alt={company.name}
              className="opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
            />
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
