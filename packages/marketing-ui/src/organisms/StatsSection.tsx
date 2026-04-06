import { SectionWrapper } from "../atomic/SectionWrapper";
import { StatBar, type StatItem } from "../molecular/StatBar";

export interface StatsSectionProps {
  stats: StatItem[];
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <SectionWrapper background="brand-dark" className="!py-16 lg:!py-20">
      <StatBar stats={stats} />
    </SectionWrapper>
  );
}
