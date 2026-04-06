import { type ReactNode } from "react";
import { SectionWrapper } from "../atomic/SectionWrapper";
import { SectionHeading } from "../atomic/SectionHeading";
import { StepCard } from "../molecular/StepCard";

export interface Step {
  title: string;
  description: string;
  icon: ReactNode;
}

export interface HowItWorksProps {
  heading: string;
  steps: Step[];
}

export function HowItWorks({ heading, steps }: HowItWorksProps) {
  return (
    <SectionWrapper background="white">
      <SectionHeading>{heading}</SectionHeading>
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
        {steps.map((step, index) => (
          <StepCard
            key={step.title}
            stepNumber={index + 1}
            title={step.title}
            description={step.description}
            icon={step.icon}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
