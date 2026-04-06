import {
  Code2, ClipboardCheck, BarChart3, FileText, Users,
  GraduationCap, ClipboardList, TrendingUp, Shield, Trophy,
  Video, Linkedin, Instagram, Youtube, Twitter,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Code2,
  ClipboardCheck,
  BarChart3,
  FileText,
  Users,
  GraduationCap,
  ClipboardList,
  TrendingUp,
  Shield,
  Trophy,
  Video,
  Linkedin,
  Instagram,
  Youtube,
  Twitter,
};

export function getIcon(name: string, className = "h-6 w-6") {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}
