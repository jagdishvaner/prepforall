import fs from "fs/promises";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");

async function loadJSON<T>(filename: string): Promise<T> {
  const filePath = path.join(CONTENT_DIR, filename);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

// --- Type definitions for content ---

export interface HomepageContent {
  hero: {
    heading: string;
    subtext: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    screenshotSrc: string;
    screenshotAlt: string;
  };
  stats: Array<{ value: number; suffix: string; label: string }>;
  offers: Array<{ iconName: string; title: string; description: string }>;
  productPreview: {
    heading: string;
    tabs: Array<{ label: string; screenshotSrc: string; screenshotAlt: string }>;
  };
  howItWorks: {
    heading: string;
    steps: Array<{ title: string; description: string; iconName: string }>;
  };
  forUniversities: {
    heading: string;
    bullets: string[];
    screenshotSrc: string;
    ctaLabel: string;
    ctaHref: string;
  };
  cta: {
    heading: string;
    ctaLabel: string;
    ctaHref: string;
  };
}

export interface TestimonialsContent {
  heading: string;
  testimonials: Array<{
    quote: string;
    name: string;
    role: string;
    institution: string;
    photoUrl: string;
  }>;
}

export interface PricingContent {
  heading: string;
  subtitle: string;
  tiers: Array<{
    tier: string;
    description: string;
    features: string[];
    ctaLabel: string;
    ctaHref: string;
    popular: boolean;
  }>;
}

export interface UniversitiesContent {
  partners: Array<{ name: string; logoSrc: string }>;
  placements: Array<{ name: string; logoSrc: string }>;
}

export interface FeaturesContent {
  heading: string;
  features: Array<{
    title: string;
    description: string;
    screenshotSrc: string;
    iconName: string;
    comingSoon?: boolean;
  }>;
}

export interface FAQContent {
  items: Array<{ question: string; answer: string }>;
}

export interface NavigationContent {
  header: {
    logoSrc: string;
    navLinks: Array<{ label: string; href: string }>;
    loginHref: string;
    ctaLabel: string;
    ctaHref: string;
  };
  footer: {
    logoSrc: string;
    tagline: string;
    columns: Array<{
      title: string;
      links: Array<{ label: string; href: string }>;
    }>;
    socialLinks: Array<{ platform: string; href: string }>;
    copyright: string;
  };
}

// --- Public API ---

export const content = {
  homepage: () => loadJSON<HomepageContent>("homepage.json"),
  testimonials: () => loadJSON<TestimonialsContent>("testimonials.json"),
  pricing: () => loadJSON<PricingContent>("pricing.json"),
  universities: () => loadJSON<UniversitiesContent>("universities.json"),
  features: () => loadJSON<FeaturesContent>("features.json"),
  faq: () => loadJSON<FAQContent>("faq.json"),
  navigation: () => loadJSON<NavigationContent>("navigation.json"),
};
