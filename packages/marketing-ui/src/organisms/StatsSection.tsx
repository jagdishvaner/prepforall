import { SectionWrapper } from "../atomic/SectionWrapper";
import { StatBar, type StatItem } from "../molecular/StatBar";

export interface StatsSectionProps {
  stats: StatItem[];
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <SectionWrapper background="dark" className="!py-10">
      <StatBar stats={stats} />
    </SectionWrapper>
  );
}
