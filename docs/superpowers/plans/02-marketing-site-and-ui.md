# Workstream B: Marketing Site + Marketing UI -- Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public-facing PrepForAll marketing site (`apps/marketing/`) and its presentational component library (`packages/marketing-ui/`) from scratch, delivering a high-performance SSG/ISR Next.js 15 site with all 10 homepage sections, public problem archive, partnership pages, and full SEO infrastructure.

**Architecture:** Marketing presentational components live in `packages/marketing-ui/` (`@prepforall/marketing-ui`) following Atomic Design (atomic, molecular, organisms), composed from `@prepforall/react` shared primitives and `@prepforall/tokens` design tokens. `apps/marketing/` contains only Next.js pages, routes, layouts, content JSON files, and page orchestration (data fetching, Server Actions, ISR) -- zero presentational components. Content is managed via git-based JSON files in `apps/marketing/content/`, read at build time by Next.js.

**Tech Stack:** Next.js 15 (App Router, SSG + ISR), React 19, TypeScript 5, Tailwind CSS 3, `@prepforall/tokens` + `@prepforall/react`, `next-sitemap`, `framer-motion` (scroll animations), Lucide React (icons), Server Actions for forms.

**Prerequisites:** Workstream A (Monorepo + Design System) must be complete. Specifically: `turbo.json` configured, `packages/ui/tokens/`, `packages/ui/css/`, `packages/ui/react/` built and importable, shared Tailwind/TypeScript/ESLint configs in `packages/config/`.

---

## Task 1: packages/marketing-ui Setup

**Goal:** Initialize the `@prepforall/marketing-ui` package with build config, TypeScript, Tailwind, and Storybook integration.

### Files to Create
- `packages/marketing-ui/package.json`
- `packages/marketing-ui/tsconfig.json`
- `packages/marketing-ui/tailwind.config.ts`
- `packages/marketing-ui/postcss.config.js`
- `packages/marketing-ui/src/index.ts` (barrel export)
- `packages/marketing-ui/src/atomic/index.ts`
- `packages/marketing-ui/src/molecular/index.ts`
- `packages/marketing-ui/src/organisms/index.ts`

### Steps

- [ ] **1.1** Create `packages/marketing-ui/package.json`:

```json
{
  "name": "@prepforall/marketing-ui",
  "version": "0.0.1",
  "private": true,
  "sideEffects": false,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./atomic": "./src/atomic/index.ts",
    "./molecular": "./src/molecular/index.ts",
    "./organisms": "./src/organisms/index.ts"
  },
  "scripts": {
    "lint": "eslint src/",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@prepforall/react": "workspace:*",
    "@prepforall/tokens": "workspace:*"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@prepforall/config-typescript": "workspace:*",
    "@prepforall/config-eslint": "workspace:*",
    "@prepforall/config-tailwind": "workspace:*",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8",
    "vitest": "^3.1.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "framer-motion": "^12.0.0",
    "lucide-react": "^0.469.0"
  }
}
```

- [ ] **1.2** Create `packages/marketing-ui/tsconfig.json`:

```json
{
  "extends": "@prepforall/config-typescript/react.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

- [ ] **1.3** Create `packages/marketing-ui/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";
import sharedConfig from "@prepforall/config-tailwind";

const config: Config = {
  presets: [sharedConfig],
  content: ["./src/**/*.{ts,tsx}"],
};

export default config;
```

- [ ] **1.4** Create `packages/marketing-ui/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **1.5** Create barrel exports for each Atomic Design layer:

`packages/marketing-ui/src/index.ts`:
```typescript
export * from "./atomic";
export * from "./molecular";
export * from "./organisms";
```

`packages/marketing-ui/src/atomic/index.ts`:
```typescript
// Marketing-specific atoms exported here
// Most atoms come from @prepforall/react — only add marketing-specific ones
```

`packages/marketing-ui/src/molecular/index.ts`:
```typescript
// Molecular components exported here as they are built
```

`packages/marketing-ui/src/organisms/index.ts`:
```typescript
// Organism components exported here as they are built
```

- [ ] **1.6** Verify setup compiles:

```bash
cd packages/marketing-ui && npx tsc --noEmit
```

Expected: No errors (empty barrel exports).

**Commit point:** `feat(marketing-ui): initialize package with build config and atomic design structure`

---

## Task 2: Marketing UI Atomic Components

**Goal:** Create marketing-specific atomic components not already covered by `@prepforall/react` shared primitives.

### Files to Create
- `packages/marketing-ui/src/atomic/SectionHeading.tsx`
- `packages/marketing-ui/src/atomic/SectionWrapper.tsx`
- `packages/marketing-ui/src/atomic/AnimatedCounter.tsx`
- `packages/marketing-ui/src/atomic/BrandLogo.tsx`
- `packages/marketing-ui/src/atomic/SectionHeading.test.tsx`
- `packages/marketing-ui/src/atomic/AnimatedCounter.test.tsx`

### Steps

- [ ] **2.1** Create `SectionWrapper` -- standardized section container with max-width 1080px, 80px vertical padding, alternating backgrounds:

```typescript
// packages/marketing-ui/src/atomic/SectionWrapper.tsx
import { type ReactNode } from "react";

export interface SectionWrapperProps {
  children: ReactNode;
  background?: "white" | "gray" | "dark";
  className?: string;
  id?: string;
}

export function SectionWrapper({
  children,
  background = "white",
  className = "",
  id,
}: SectionWrapperProps) {
  const bgClasses = {
    white: "bg-white",
    gray: "bg-gray-50",
    dark: "bg-gray-900 text-white",
  };

  return (
    <section id={id} className={`py-20 ${bgClasses[background]} ${className}`}>
      <div className="mx-auto max-w-[1080px] px-6">{children}</div>
    </section>
  );
}
```

- [ ] **2.2** Create `SectionHeading` -- DM Sans Bold heading with optional subtext:

```typescript
// packages/marketing-ui/src/atomic/SectionHeading.tsx
import { type ReactNode } from "react";

export interface SectionHeadingProps {
  children: ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
}

export function SectionHeading({
  children,
  subtitle,
  align = "center",
  light = false,
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  const colorClass = light ? "text-white" : "text-gray-900";
  const subtitleColor = light ? "text-gray-300" : "text-gray-600";

  return (
    <div className={`mb-12 ${alignClass}`}>
      <h2
        className={`font-heading text-3xl font-bold tracking-tight md:text-4xl ${colorClass}`}
      >
        {children}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-lg ${subtitleColor}`}>{subtitle}</p>
      )}
    </div>
  );
}
```

- [ ] **2.3** Create `AnimatedCounter` -- number that counts up on scroll using Intersection Observer + framer-motion:

```typescript
// packages/marketing-ui/src/atomic/AnimatedCounter.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, motion, useMotionValue, useTransform, animate } from "framer-motion";

export interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({
  target,
  suffix = "",
  duration = 2,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, target, {
      duration,
      onUpdate(value) {
        setDisplayValue(Math.round(value));
      },
    });

    return () => controls.stop();
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue}
      {suffix}
    </span>
  );
}
```

- [ ] **2.4** Create `BrandLogo` -- renders brand/university/company logo with consistent sizing:

```typescript
// packages/marketing-ui/src/atomic/BrandLogo.tsx
import Image from "next/image";

export interface BrandLogoProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function BrandLogo({
  src,
  alt,
  width = 120,
  height = 48,
  className = "",
}: BrandLogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-contain"
      />
    </div>
  );
}
```

- [ ] **2.5** Write tests for `SectionHeading`:

```typescript
// packages/marketing-ui/src/atomic/SectionHeading.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SectionHeading } from "./SectionHeading";

describe("SectionHeading", () => {
  it("renders heading text", () => {
    render(<SectionHeading>Test Heading</SectionHeading>);
    expect(screen.getByText("Test Heading")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<SectionHeading subtitle="Sub text">Heading</SectionHeading>);
    expect(screen.getByText("Sub text")).toBeInTheDocument();
  });

  it("applies center alignment by default", () => {
    render(<SectionHeading>Heading</SectionHeading>);
    const wrapper = screen.getByText("Heading").parentElement;
    expect(wrapper?.className).toContain("text-center");
  });

  it("applies left alignment when specified", () => {
    render(<SectionHeading align="left">Heading</SectionHeading>);
    const wrapper = screen.getByText("Heading").parentElement;
    expect(wrapper?.className).toContain("text-left");
  });
});
```

- [ ] **2.6** Update `packages/marketing-ui/src/atomic/index.ts`:

```typescript
export { SectionWrapper, type SectionWrapperProps } from "./SectionWrapper";
export { SectionHeading, type SectionHeadingProps } from "./SectionHeading";
export { AnimatedCounter, type AnimatedCounterProps } from "./AnimatedCounter";
export { BrandLogo, type BrandLogoProps } from "./BrandLogo";
```

- [ ] **2.7** Run tests:

```bash
cd packages/marketing-ui && npx vitest run
```

Expected: All tests pass.

**Commit point:** `feat(marketing-ui): add atomic components — SectionWrapper, SectionHeading, AnimatedCounter, BrandLogo`

---

## Task 3: Marketing UI Molecular Components

**Goal:** Build the molecular-level components: StatBar, TestimonialCard, PricingCard, FeatureCard, StepCard.

### Files to Create
- `packages/marketing-ui/src/molecular/StatBar.tsx`
- `packages/marketing-ui/src/molecular/TestimonialCard.tsx`
- `packages/marketing-ui/src/molecular/PricingCard.tsx`
- `packages/marketing-ui/src/molecular/FeatureCard.tsx`
- `packages/marketing-ui/src/molecular/StepCard.tsx`
- `packages/marketing-ui/src/molecular/FeatureCard.test.tsx`
- `packages/marketing-ui/src/molecular/PricingCard.test.tsx`

### Steps

- [ ] **3.1** Create `StatBar` -- single stat item with animated counter, label, and optional suffix:

```typescript
// packages/marketing-ui/src/molecular/StatBar.tsx
"use client";

import { AnimatedCounter } from "../atomic/AnimatedCounter";

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

export interface StatBarProps {
  stats: StatItem[];
}

export function StatBar({ stats }: StatBarProps) {
  return (
    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="text-3xl font-bold text-white md:text-4xl">
            <AnimatedCounter target={stat.value} suffix={stat.suffix} />
          </p>
          <p className="mt-2 text-sm text-gray-300">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **3.2** Create `TestimonialCard`:

```typescript
// packages/marketing-ui/src/molecular/TestimonialCard.tsx
import Image from "next/image";

export interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  institution: string;
  photoUrl: string;
}

export function TestimonialCard({
  quote,
  name,
  role,
  institution,
  photoUrl,
}: TestimonialCardProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <blockquote className="text-xl leading-relaxed text-gray-700 md:text-2xl">
        “{quote}”
      </blockquote>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Image
          src={photoUrl}
          alt={name}
          width={56}
          height={56}
          className="rounded-full object-cover"
        />
        <div className="text-left">
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">
            {role}, {institution}
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **3.3** Create `PricingCard`:

```typescript
// packages/marketing-ui/src/molecular/PricingCard.tsx
import { type ReactNode } from "react";

export interface PricingCardProps {
  tier: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  popular?: boolean;
}

export function PricingCard({
  tier,
  description,
  features,
  ctaLabel,
  ctaHref,
  popular = false,
}: PricingCardProps) {
  return (
    <div
      className={`relative rounded-2xl border p-8 ${
        popular
          ? "border-brand-primary bg-white shadow-lg ring-2 ring-brand-primary"
          : "border-gray-200 bg-white"
      }`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-primary px-4 py-1 text-xs font-semibold text-white">
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-bold text-gray-900">{tier}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <ul className="mt-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <a
        href={ctaHref}
        className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
          popular
            ? "bg-brand-primary text-white hover:bg-brand-primary/90"
            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
      >
        {ctaLabel}
      </a>
    </div>
  );
}
```

- [ ] **3.4** Create `FeatureCard`:

```typescript
// packages/marketing-ui/src/molecular/FeatureCard.tsx
import { type ReactNode } from "react";

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-600">{description}</p>
    </div>
  );
}
```

- [ ] **3.5** Create `StepCard`:

```typescript
// packages/marketing-ui/src/molecular/StepCard.tsx
import { type ReactNode } from "react";

export interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: ReactNode;
  isLast?: boolean;
}

export function StepCard({
  stepNumber,
  title,
  description,
  icon,
  isLast = false,
}: StepCardProps) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[calc(50%+40px)] top-6 hidden h-0.5 w-[calc(100%-80px)] bg-gray-200 lg:block" />
      )}
      <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-white">
        {stepNumber}
      </div>
      <div className="mb-3 text-brand-primary">{icon}</div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="max-w-[200px] text-sm text-gray-600">{description}</p>
    </div>
  );
}
```

- [ ] **3.6** Write tests for `FeatureCard` and `PricingCard`:

```typescript
// packages/marketing-ui/src/molecular/FeatureCard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FeatureCard } from "./FeatureCard";

describe("FeatureCard", () => {
  it("renders title and description", () => {
    render(
      <FeatureCard
        icon={<span data-testid="icon">IC</span>}
        title="Practice"
        description="200+ DSA problems"
      />
    );
    expect(screen.getByText("Practice")).toBeInTheDocument();
    expect(screen.getByText("200+ DSA problems")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
```

```typescript
// packages/marketing-ui/src/molecular/PricingCard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PricingCard } from "./PricingCard";

describe("PricingCard", () => {
  const defaultProps = {
    tier: "Starter",
    description: "Up to 100 students",
    features: ["Platform access", "Support"],
    ctaLabel: "Contact Us",
    ctaHref: "/contact",
  };

  it("renders tier name and description", () => {
    render(<PricingCard {...defaultProps} />);
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Up to 100 students")).toBeInTheDocument();
  });

  it("renders all features", () => {
    render(<PricingCard {...defaultProps} />);
    expect(screen.getByText("Platform access")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("shows popular badge when popular", () => {
    render(<PricingCard {...defaultProps} popular />);
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });
});
```

- [ ] **3.7** Update `packages/marketing-ui/src/molecular/index.ts`:

```typescript
export { StatBar, type StatItem, type StatBarProps } from "./StatBar";
export { TestimonialCard, type TestimonialCardProps } from "./TestimonialCard";
export { PricingCard, type PricingCardProps } from "./PricingCard";
export { FeatureCard, type FeatureCardProps } from "./FeatureCard";
export { StepCard, type StepCardProps } from "./StepCard";
```

- [ ] **3.8** Run tests:

```bash
cd packages/marketing-ui && npx vitest run
```

Expected: All tests pass.

**Commit point:** `feat(marketing-ui): add molecular components — StatBar, TestimonialCard, PricingCard, FeatureCard, StepCard`

---

## Task 4: Marketing UI Organism Components

**Goal:** Build all organism-level components that compose molecular and atomic pieces into full homepage sections and site-wide navigation.

### Files to Create
- `packages/marketing-ui/src/organisms/HeroBlock.tsx`
- `packages/marketing-ui/src/organisms/StatsSection.tsx`
- `packages/marketing-ui/src/organisms/OfferSection.tsx`
- `packages/marketing-ui/src/organisms/ProductPreview.tsx`
- `packages/marketing-ui/src/organisms/HowItWorks.tsx`
- `packages/marketing-ui/src/organisms/UniversityPartners.tsx`
- `packages/marketing-ui/src/organisms/TestimonialCarousel.tsx`
- `packages/marketing-ui/src/organisms/PlacementLogos.tsx`
- `packages/marketing-ui/src/organisms/CTASection.tsx`
- `packages/marketing-ui/src/organisms/PricingBlock.tsx`
- `packages/marketing-ui/src/organisms/ContactForm.tsx`
- `packages/marketing-ui/src/organisms/Header.tsx`
- `packages/marketing-ui/src/organisms/Footer.tsx`
- `packages/marketing-ui/src/organisms/HeroBlock.test.tsx`
- `packages/marketing-ui/src/organisms/Header.test.tsx`

### Steps

- [ ] **4.1** Create `HeroBlock` -- two-column hero with heading, subtext, two CTAs, and product screenshot:

```typescript
// packages/marketing-ui/src/organisms/HeroBlock.tsx
import Image from "next/image";
import Link from "next/link";
import { SectionWrapper } from "../atomic/SectionWrapper";

export interface HeroBlockProps {
  heading: string;
  subtext: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  screenshotSrc: string;
  screenshotAlt: string;
}

export function HeroBlock({
  heading,
  subtext,
  primaryCta,
  secondaryCta,
  screenshotSrc,
  screenshotAlt,
}: HeroBlockProps) {
  return (
    <SectionWrapper background="white">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
            {heading}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">{subtext}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={primaryCta.href}
              className="rounded-lg bg-brand-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
            >
              {primaryCta.label}
            </Link>
            <Link
              href={secondaryCta.href}
              className="text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary/80"
            >
              {secondaryCta.label} →
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-2xl">
            <Image
              src={screenshotSrc}
              alt={screenshotAlt}
              width={640}
              height={400}
              className="w-full"
              priority
            />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **4.2** Create `StatsSection`:

```typescript
// packages/marketing-ui/src/organisms/StatsSection.tsx
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
```

- [ ] **4.3** Create `OfferSection` -- "What We Offer" with 3 FeatureCards:

```typescript
// packages/marketing-ui/src/organisms/OfferSection.tsx
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
```

- [ ] **4.4** Create `ProductPreview` -- tabbed screenshots section:

```typescript
// packages/marketing-ui/src/organisms/ProductPreview.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { SectionWrapper } from "../atomic/SectionWrapper";
import { SectionHeading } from "../atomic/SectionHeading";

export interface ProductTab {
  label: string;
  screenshotSrc: string;
  screenshotAlt: string;
}

export interface ProductPreviewProps {
  heading: string;
  subtitle?: string;
  tabs: ProductTab[];
}

export function ProductPreview({ heading, subtitle, tabs }: ProductPreviewProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SectionWrapper background="gray">
      <SectionHeading subtitle={subtitle}>{heading}</SectionHeading>
      <div className="mb-8 flex justify-center gap-2">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(index)}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              index === activeTab
                ? "bg-brand-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex h-8 items-center gap-2 border-b border-gray-200 bg-gray-100 px-4">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <Image
            src={tabs[activeTab].screenshotSrc}
            alt={tabs[activeTab].screenshotAlt}
            width={896}
            height={560}
            className="w-full"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **4.5** Create `HowItWorks`:

```typescript
// packages/marketing-ui/src/organisms/HowItWorks.tsx
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
```

- [ ] **4.6** Create `UniversityPartners` -- auto-scrolling logo bar:

```typescript
// packages/marketing-ui/src/organisms/UniversityPartners.tsx
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
```

- [ ] **4.7** Create `TestimonialCarousel`:

```typescript
// packages/marketing-ui/src/organisms/TestimonialCarousel.tsx
"use client";

import { useState } from "react";
import { SectionWrapper } from "../atomic/SectionWrapper";
import { SectionHeading } from "../atomic/SectionHeading";
import { TestimonialCard, type TestimonialCardProps } from "../molecular/TestimonialCard";

export interface TestimonialCarouselProps {
  heading: string;
  testimonials: TestimonialCardProps[];
}

export function TestimonialCarousel({
  heading,
  testimonials,
}: TestimonialCarouselProps) {
  const [current, setCurrent] = useState(0);

  return (
    <SectionWrapper background="gray">
      <SectionHeading>{heading}</SectionHeading>
      <TestimonialCard {...testimonials[current]} />
      <div className="mt-8 flex justify-center gap-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              index === current ? "bg-brand-primary" : "bg-gray-300"
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **4.8** Create `PlacementLogos`:

```typescript
// packages/marketing-ui/src/organisms/PlacementLogos.tsx
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
```

- [ ] **4.9** Create `CTASection`:

```typescript
// packages/marketing-ui/src/organisms/CTASection.tsx
import Link from "next/link";
import { SectionWrapper } from "../atomic/SectionWrapper";

export interface CTASectionProps {
  heading: string;
  ctaLabel: string;
  ctaHref: string;
}

export function CTASection({ heading, ctaLabel, ctaHref }: CTASectionProps) {
  return (
    <SectionWrapper background="dark">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
          {heading}
        </h2>
        <Link
          href={ctaHref}
          className="mt-8 inline-block rounded-lg bg-brand-accent px-10 py-4 text-sm font-semibold text-white transition-colors hover:bg-brand-accent/90"
        >
          {ctaLabel}
        </Link>
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **4.10** Create `PricingBlock`:

```typescript
// packages/marketing-ui/src/organisms/PricingBlock.tsx
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
```

- [ ] **4.11** Create `ContactForm` -- presentational form, onSubmit handler passed as prop:

```typescript
// packages/marketing-ui/src/organisms/ContactForm.tsx
"use client";

import { useRef, type FormEvent } from "react";

export interface ContactFormFields {
  name: string;
  email: string;
  subject?: string;
  phone?: string;
  institution?: string;
  studentCount?: string;
  message: string;
}

export interface ContactFormProps {
  fields: Array<{
    name: keyof ContactFormFields;
    label: string;
    type: "text" | "email" | "tel" | "textarea" | "select";
    placeholder: string;
    required?: boolean;
    options?: string[];
  }>;
  submitLabel: string;
  onSubmit: (data: FormData) => void | Promise<void>;
  pending?: boolean;
  successMessage?: string;
}

export function ContactForm({
  fields,
  submitLabel,
  onSubmit,
  pending = false,
  successMessage,
}: ContactFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await onSubmit(formData);
    formRef.current?.reset();
  };

  if (successMessage) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-lg font-semibold text-green-800">{successMessage}</p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={field.name}
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          {field.type === "textarea" ? (
            <textarea
              id={field.name}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          ) : field.type === "select" ? (
            <select
              id={field.name}
              name={field.name}
              required={field.required}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            >
              <option value="">{field.placeholder}</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
      >
        {pending ? "Sending..." : submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **4.12** Create `Header`:

```typescript
// packages/marketing-ui/src/organisms/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface NavLink {
  label: string;
  href: string;
}

export interface HeaderProps {
  logoSrc: string;
  navLinks: NavLink[];
  loginHref: string;
  ctaLabel: string;
  ctaHref: string;
}

export function Header({
  logoSrc,
  navLinks,
  loginHref,
  ctaLabel,
  ctaHref,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src={logoSrc} alt="PrepForAll" width={140} height={32} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={loginHref}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Login
          </Link>
          <Link
            href={ctaHref}
            className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
          >
            {ctaLabel}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-6 py-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-gray-600"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <Link href={loginHref} className="rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium">
              Login
            </Link>
            <Link href={ctaHref} className="rounded-lg bg-brand-primary px-4 py-2 text-center text-sm font-semibold text-white">
              {ctaLabel}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **4.13** Create `Footer`:

```typescript
// packages/marketing-ui/src/organisms/Footer.tsx
import Link from "next/link";
import Image from "next/image";

export interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

export interface SocialLink {
  platform: string;
  href: string;
  icon: React.ReactNode;
}

export interface FooterProps {
  logoSrc: string;
  tagline: string;
  columns: FooterColumn[];
  socialLinks: SocialLink[];
  copyright: string;
}

export function Footer({
  logoSrc,
  tagline,
  columns,
  socialLinks,
  copyright,
}: FooterProps) {
  return (
    <footer className="bg-gray-900 px-6 py-16 text-gray-400">
      <div className="mx-auto max-w-[1080px]">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand column */}
          <div className="md:col-span-2">
            <Image src={logoSrc} alt="PrepForAll" width={140} height={32} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">{tagline}</p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 transition-colors hover:text-white"
                  aria-label={social.platform}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-semibold text-white">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm">
          {copyright}
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **4.14** Write tests for `Header`:

```typescript
// packages/marketing-ui/src/organisms/Header.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Header } from "./Header";

// Mock next/image and next/link
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe("Header", () => {
  const props = {
    logoSrc: "/logo.svg",
    navLinks: [
      { label: "Problems", href: "/problems" },
      { label: "Features", href: "/features" },
    ],
    loginHref: "https://app.prepforall.com",
    ctaLabel: "Request Demo",
    ctaHref: "/for-universities",
  };

  it("renders navigation links", () => {
    render(<Header {...props} />);
    expect(screen.getByText("Problems")).toBeInTheDocument();
    expect(screen.getByText("Features")).toBeInTheDocument();
  });

  it("renders CTA button", () => {
    render(<Header {...props} />);
    expect(screen.getAllByText("Request Demo").length).toBeGreaterThan(0);
  });
});
```

- [ ] **4.15** Update `packages/marketing-ui/src/organisms/index.ts`:

```typescript
export { HeroBlock, type HeroBlockProps } from "./HeroBlock";
export { StatsSection, type StatsSectionProps } from "./StatsSection";
export { OfferSection, type OfferSectionProps, type OfferItem } from "./OfferSection";
export { ProductPreview, type ProductPreviewProps, type ProductTab } from "./ProductPreview";
export { HowItWorks, type HowItWorksProps, type Step } from "./HowItWorks";
export { UniversityPartners, type UniversityPartnersProps, type Partner } from "./UniversityPartners";
export { TestimonialCarousel, type TestimonialCarouselProps } from "./TestimonialCarousel";
export { PlacementLogos, type PlacementLogosProps, type PlacementCompany } from "./PlacementLogos";
export { CTASection, type CTASectionProps } from "./CTASection";
export { PricingBlock, type PricingBlockProps } from "./PricingBlock";
export { ContactForm, type ContactFormProps, type ContactFormFields } from "./ContactForm";
export { Header, type HeaderProps, type NavLink } from "./Header";
export { Footer, type FooterProps, type FooterColumn, type SocialLink } from "./Footer";
```

- [ ] **4.16** Run all marketing-ui tests:

```bash
cd packages/marketing-ui && npx vitest run
```

Expected: All tests pass.

**Commit point:** `feat(marketing-ui): add organism components — HeroBlock, StatsSection, OfferSection, ProductPreview, HowItWorks, UniversityPartners, TestimonialCarousel, PlacementLogos, CTASection, PricingBlock, ContactForm, Header, Footer`

---

## Task 5: apps/marketing Next.js Setup

**Goal:** Initialize the `apps/marketing/` Next.js 15 application with App Router, layouts, font loading, and Tailwind configuration.

### Files to Create
- `apps/marketing/package.json`
- `apps/marketing/next.config.ts`
- `apps/marketing/tsconfig.json`
- `apps/marketing/tailwind.config.ts`
- `apps/marketing/postcss.config.js`
- `apps/marketing/.env.example`
- `apps/marketing/app/layout.tsx`
- `apps/marketing/app/globals.css`
- `apps/marketing/app/not-found.tsx`
- `apps/marketing/lib/fonts.ts`
- `apps/marketing/lib/metadata.ts`

### Files to Modify
- `turbo.json` (add marketing build task if not present)
- `.gitignore` (add `apps/marketing/.next/`, `apps/marketing/node_modules/`)

### Steps

- [ ] **5.1** Create `apps/marketing/package.json`:

```json
{
  "name": "@prepforall/marketing",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@prepforall/marketing-ui": "workspace:*",
    "@prepforall/react": "workspace:*",
    "@prepforall/tokens": "workspace:*",
    "framer-motion": "^12.0.0",
    "lucide-react": "^0.469.0",
    "next": "^15.0.0",
    "next-sitemap": "^4.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@prepforall/config-typescript": "workspace:*",
    "@prepforall/config-eslint": "workspace:*",
    "@prepforall/config-tailwind": "workspace:*",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.4.20",
    "eslint": "^8",
    "eslint-config-next": "^15.0.0",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

- [ ] **5.2** Create `apps/marketing/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: [
    "@prepforall/marketing-ui",
    "@prepforall/react",
    "@prepforall/tokens",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.prepforall.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **5.3** Create `apps/marketing/tsconfig.json`:

```json
{
  "extends": "@prepforall/config-typescript/nextjs.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@content/*": ["./content/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **5.4** Create `apps/marketing/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";
import sharedConfig from "@prepforall/config-tailwind";

const config: Config = {
  presets: [sharedConfig],
  content: [
    "./app/**/*.{ts,tsx}",
    "./content/**/*.json",
    "../../packages/marketing-ui/src/**/*.{ts,tsx}",
    "../../packages/ui/react/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-dm-sans)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      colors: {
        "brand-primary": "var(--color-brand-primary)",
        "brand-accent": "var(--color-brand-accent)",
      },
      maxWidth: {
        content: "1080px",
      },
      animation: {
        scroll: "scroll 30s linear infinite",
      },
      keyframes: {
        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
};

export default config;
```

- [ ] **5.5** Create `apps/marketing/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **5.6** Create `apps/marketing/lib/fonts.ts`:

```typescript
import { DM_Sans, Inter, JetBrains_Mono } from "next/font/google";

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
```

- [ ] **5.7** Create `apps/marketing/lib/metadata.ts`:

```typescript
import type { Metadata } from "next";

const BASE_URL = "https://prepforall.com";

export function createMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: "PrepForAll — Coding Practice & Placement Preparation Platform",
      template: "%s | PrepForAll",
    },
    description:
      "LeetCode-grade coding practice, timed assessments, and analytics for universities and training partners. 200+ DSA & SQL problems.",
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: BASE_URL,
      siteName: "PrepForAll",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PrepForAll" }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@prepforall",
    },
    robots: {
      index: true,
      follow: true,
    },
    ...overrides,
  };
}
```

- [ ] **5.8** Create `apps/marketing/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-brand-primary: #2563eb;
    --color-brand-accent: #3b82f6;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    @apply font-body text-gray-900 antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }
}
```

- [ ] **5.9** Create `apps/marketing/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { dmSans, inter, jetbrainsMono } from "@/lib/fonts";
import { createMetadata } from "@/lib/metadata";
import "./globals.css";

export const metadata: Metadata = createMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **5.10** Create `apps/marketing/app/not-found.tsx`:

```typescript
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="font-heading text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-lg text-gray-600">Page not found</p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white"
      >
        Go home
      </Link>
    </div>
  );
}
```

- [ ] **5.11** Create `apps/marketing/.env.example`:

```
# Go API base URL for ISR data fetching
API_URL=http://localhost:8080

# Base URL for SEO / canonical
NEXT_PUBLIC_BASE_URL=https://prepforall.com

# Platform app URL (for Login redirect)
NEXT_PUBLIC_PLATFORM_URL=https://app.prepforall.com
```

- [ ] **5.12** Verify the app starts:

```bash
cd apps/marketing && npx next dev --port 3001
```

Expected: Next.js dev server starts on port 3001, renders the root layout.

**Commit point:** `feat(marketing): initialize Next.js 15 app with layout, fonts, Tailwind, and metadata`

---

## Task 6: Content JSON Files

**Goal:** Create all git-based JSON content files that drive the marketing site.

### Files to Create
- `apps/marketing/content/homepage.json`
- `apps/marketing/content/testimonials.json`
- `apps/marketing/content/pricing.json`
- `apps/marketing/content/universities.json`
- `apps/marketing/content/features.json`
- `apps/marketing/content/faq.json`
- `apps/marketing/content/navigation.json`
- `apps/marketing/lib/content.ts`

### Steps

- [ ] **6.1** Create `apps/marketing/content/homepage.json`:

```json
{
  "hero": {
    "heading": "Build your coding skills, ace your placements.",
    "subtext": "Your end-to-end coding platform for practice, assessments & placement preparation.",
    "primaryCta": { "label": "Request a Demo", "href": "/for-universities" },
    "secondaryCta": { "label": "Explore Problems", "href": "/problems" },
    "screenshotSrc": "/images/hero-screenshot.png",
    "screenshotAlt": "PrepForAll coding workspace with a green Accepted verdict"
  },
  "stats": [
    { "value": 200, "suffix": "+", "label": "Problems" },
    { "value": 8, "suffix": "+", "label": "Partner Colleges" },
    { "value": 500, "suffix": "+", "label": "Students Trained" },
    { "value": 95, "suffix": "%", "label": "Placement Confidence" }
  ],
  "offers": [
    {
      "iconName": "Code2",
      "title": "Practice",
      "description": "200+ DSA & SQL problems with real code execution in a sandboxed environment."
    },
    {
      "iconName": "ClipboardCheck",
      "title": "Assess",
      "description": "Timed tests with proctoring. Assign to batches and track completion."
    },
    {
      "iconName": "BarChart3",
      "title": "Analyze",
      "description": "Student & batch-wise analytics. Track progress and identify at-risk students."
    }
  ],
  "productPreview": {
    "heading": "A LeetCode-grade editor, inside your classroom",
    "tabs": [
      { "label": "Coding Platform", "screenshotSrc": "/images/preview-editor.png", "screenshotAlt": "Code editor with syntax highlighting" },
      { "label": "Trainer Dashboard", "screenshotSrc": "/images/preview-dashboard.png", "screenshotAlt": "Trainer dashboard with batch management" },
      { "label": "Analytics", "screenshotSrc": "/images/preview-analytics.png", "screenshotAlt": "Analytics dashboard with charts" }
    ]
  },
  "howItWorks": {
    "heading": "How PrepForAll works",
    "steps": [
      { "title": "Sign an MOU", "description": "Partner with us through a simple agreement.", "iconName": "FileText" },
      { "title": "Trainers get access", "description": "Your trainers receive full platform access.", "iconName": "Users" },
      { "title": "Students enroll", "description": "Students are added to batches by trainers.", "iconName": "GraduationCap" },
      { "title": "Tests assigned", "description": "Trainers create and assign timed assessments.", "iconName": "ClipboardList" },
      { "title": "Track progress", "description": "Monitor performance with detailed analytics.", "iconName": "TrendingUp" }
    ]
  },
  "forUniversities": {
    "heading": "Built for training partners & universities",
    "bullets": [
      "Batch management for organized training",
      "Trainer dashboards with full control",
      "Exportable reports for NAAC/NIRF accreditation",
      "Co-branded certificates for students",
      "Dedicated support from our team"
    ],
    "screenshotSrc": "/images/uni-dashboard.png",
    "ctaLabel": "Learn More",
    "ctaHref": "/for-universities"
  },
  "cta": {
    "heading": "Ready to transform your classroom?",
    "ctaLabel": "Request a Demo",
    "ctaHref": "/for-universities"
  }
}
```

- [ ] **6.2** Create `apps/marketing/content/testimonials.json`:

```json
{
  "heading": "What our partners say",
  "testimonials": [
    {
      "quote": "PrepForAll transformed how we deliver coding training. The analytics alone justified the partnership.",
      "name": "Dr. Priya Sharma",
      "role": "Head of Training",
      "institution": "Vikash Tech Solution",
      "photoUrl": "/images/testimonials/priya.jpg"
    },
    {
      "quote": "Our students' placement rates jumped 30% in the first semester. The LeetCode-style practice was exactly what they needed.",
      "name": "Prof. Rajesh Kumar",
      "role": "Placement Coordinator",
      "institution": "SRM University",
      "photoUrl": "/images/testimonials/rajesh.jpg"
    },
    {
      "quote": "The batch management and test assignment features save us hours every week. It's like having an extra team member.",
      "name": "Ananya Iyer",
      "role": "Senior Trainer",
      "institution": "SpleN Technologies",
      "photoUrl": "/images/testimonials/ananya.jpg"
    }
  ]
}
```

- [ ] **6.3** Create `apps/marketing/content/pricing.json`:

```json
{
  "heading": "Simple, transparent pricing for institutions",
  "subtitle": "All plans include trainer onboarding, co-branded certificates, and exportable reports.",
  "tiers": [
    {
      "tier": "Starter",
      "description": "Up to 100 students",
      "features": [
        "Full problem library (200+ DSA & SQL)",
        "Up to 3 trainer accounts",
        "Batch management",
        "Basic analytics",
        "Email support",
        "Trainer onboarding session"
      ],
      "ctaLabel": "Contact for Quote",
      "ctaHref": "/contact",
      "popular": false
    },
    {
      "tier": "Growth",
      "description": "Up to 500 students",
      "features": [
        "Everything in Starter",
        "Unlimited trainer accounts",
        "Advanced analytics & reports",
        "Custom test templates",
        "NAAC/NIRF export reports",
        "Priority support",
        "Co-branded certificates"
      ],
      "ctaLabel": "Contact for Quote",
      "ctaHref": "/contact",
      "popular": true
    },
    {
      "tier": "Enterprise",
      "description": "Unlimited students",
      "features": [
        "Everything in Growth",
        "Dedicated account manager",
        "Custom problem sets",
        "API access",
        "SLA guarantee",
        "White-label option",
        "On-site training workshops"
      ],
      "ctaLabel": "Contact for Quote",
      "ctaHref": "/contact",
      "popular": false
    }
  ],
  "faqRef": "faq.json"
}
```

- [ ] **6.4** Create `apps/marketing/content/universities.json`:

```json
{
  "partners": [
    { "name": "SRM University", "logoSrc": "/images/universities/srm.png" },
    { "name": "VIT University", "logoSrc": "/images/universities/vit.png" },
    { "name": "SASTRA University", "logoSrc": "/images/universities/sastra.png" },
    { "name": "Manipal Institute", "logoSrc": "/images/universities/manipal.png" },
    { "name": "NIT Trichy", "logoSrc": "/images/universities/nit-trichy.png" },
    { "name": "PSG College of Technology", "logoSrc": "/images/universities/psg.png" },
    { "name": "CIT", "logoSrc": "/images/universities/cit.png" }
  ],
  "placements": [
    { "name": "Microsoft", "logoSrc": "/images/companies/microsoft.png" },
    { "name": "Google", "logoSrc": "/images/companies/google.png" },
    { "name": "Amazon", "logoSrc": "/images/companies/amazon.png" },
    { "name": "TCS", "logoSrc": "/images/companies/tcs.png" },
    { "name": "Infosys", "logoSrc": "/images/companies/infosys.png" },
    { "name": "Wipro", "logoSrc": "/images/companies/wipro.png" },
    { "name": "Accenture", "logoSrc": "/images/companies/accenture.png" },
    { "name": "Deloitte", "logoSrc": "/images/companies/deloitte.png" },
    { "name": "Cognizant", "logoSrc": "/images/companies/cognizant.png" },
    { "name": "Capgemini", "logoSrc": "/images/companies/capgemini.png" }
  ]
}
```

- [ ] **6.5** Create `apps/marketing/content/features.json`:

```json
{
  "heading": "Everything you need to build coding excellence",
  "features": [
    {
      "title": "Code Editor",
      "description": "Monaco editor with multi-language support, auto-complete, dark/light themes, and syntax highlighting.",
      "screenshotSrc": "/images/features/editor.png",
      "iconName": "Code2"
    },
    {
      "title": "Sandboxed Execution",
      "description": "gVisor isolation for 6 languages plus SQL. Instant verdicts with resource limits and zero network access.",
      "screenshotSrc": "/images/features/sandbox.png",
      "iconName": "Shield"
    },
    {
      "title": "Contests",
      "description": "Rated contests with live leaderboards. ICPC and IOI-style formats with real-time scoring.",
      "screenshotSrc": "/images/features/contests.png",
      "iconName": "Trophy"
    },
    {
      "title": "Test Engine",
      "description": "Timed tests with batch assignment, proctoring, and company-specific templates (TCS, Infosys, Cognizant).",
      "screenshotSrc": "/images/features/tests.png",
      "iconName": "ClipboardCheck"
    },
    {
      "title": "Analytics",
      "description": "Topic breakdown, heatmaps, at-risk student flags, and exportable reports for NAAC/NIRF.",
      "screenshotSrc": "/images/features/analytics.png",
      "iconName": "BarChart3"
    },
    {
      "title": "Mock Interviews",
      "description": "Video plus collaborative coding for 1-on-1 mock interview sessions. Coming soon.",
      "screenshotSrc": "/images/features/interviews.png",
      "iconName": "Video",
      "comingSoon": true
    }
  ]
}
```

- [ ] **6.6** Create `apps/marketing/content/faq.json`:

```json
{
  "items": [
    {
      "question": "How does pricing work?",
      "answer": "We offer institution-level pricing based on student count. Contact us for a custom quote tailored to your needs."
    },
    {
      "question": "Can students sign up individually?",
      "answer": "No. PrepForAll is B2B only. Students get access through their university or training partner."
    },
    {
      "question": "What programming languages are supported?",
      "answer": "We support C++, C, Java, Python 3, JavaScript, and Go for DSA problems, plus SQL for database problems."
    },
    {
      "question": "How is code execution secured?",
      "answer": "Every submission runs in a gVisor-sandboxed Docker container with zero network access and hard resource limits."
    },
    {
      "question": "Do you provide reports for NAAC/NIRF?",
      "answer": "Yes. Growth and Enterprise plans include exportable analytics reports formatted for accreditation bodies."
    },
    {
      "question": "What does onboarding look like?",
      "answer": "We provide a dedicated onboarding session for trainers, help set up batches, and provide ongoing support."
    }
  ]
}
```

- [ ] **6.7** Create `apps/marketing/content/navigation.json`:

```json
{
  "header": {
    "logoSrc": "/images/logo.svg",
    "navLinks": [
      { "label": "Problems", "href": "/problems" },
      { "label": "Features", "href": "/features" },
      { "label": "For Universities", "href": "/for-universities" }
    ],
    "loginHref": "https://app.prepforall.com",
    "ctaLabel": "Request Demo",
    "ctaHref": "/for-universities"
  },
  "footer": {
    "logoSrc": "/images/logo-white.svg",
    "tagline": "Your end-to-end coding platform for practice, assessments & placement preparation.",
    "columns": [
      {
        "title": "Product",
        "links": [
          { "label": "Features", "href": "/features" },
          { "label": "Problems", "href": "/problems" },
          { "label": "For Universities", "href": "/for-universities" },
          { "label": "Pricing", "href": "/pricing" }
        ]
      },
      {
        "title": "Company",
        "links": [
          { "label": "About", "href": "/about" },
          { "label": "Contact", "href": "/contact" }
        ]
      },
      {
        "title": "Legal",
        "links": [
          { "label": "Privacy Policy", "href": "/privacy" },
          { "label": "Terms of Service", "href": "/terms" }
        ]
      }
    ],
    "socialLinks": [
      { "platform": "LinkedIn", "href": "https://linkedin.com/company/prepforall" },
      { "platform": "Instagram", "href": "https://instagram.com/prepforall" },
      { "platform": "YouTube", "href": "https://youtube.com/@prepforall" },
      { "platform": "Twitter", "href": "https://twitter.com/prepforall" }
    ],
    "copyright": "© 2026 PrepForAll. All rights reserved."
  }
}
```

- [ ] **6.8** Create `apps/marketing/lib/content.ts` -- typed content loader:

```typescript
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
```

- [ ] **6.9** Verify content loads correctly:

```bash
cd apps/marketing && node -e "
  const fs = require('fs');
  const files = ['homepage','testimonials','pricing','universities','features','faq','navigation'];
  files.forEach(f => {
    const data = JSON.parse(fs.readFileSync('content/' + f + '.json', 'utf-8'));
    console.log(f + '.json: OK (' + Object.keys(data).length + ' keys)');
  });
"
```

Expected: All 7 files parse without error.

**Commit point:** `feat(marketing): add content JSON files and typed content loader`

---

## Task 7: Homepage (All 10 Sections)

**Goal:** Build the homepage composing all marketing-ui organisms, driven by `homepage.json` content.

### Files to Create
- `apps/marketing/app/(marketing)/layout.tsx`
- `apps/marketing/app/(marketing)/page.tsx`
- `apps/marketing/lib/icons.tsx`

### Steps

- [ ] **7.1** Create `apps/marketing/lib/icons.tsx` -- maps icon names from JSON to Lucide React components:

```typescript
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
```

- [ ] **7.2** Create `apps/marketing/app/(marketing)/layout.tsx` -- marketing layout with Header and Footer:

```typescript
import { content } from "@/lib/content";
import { Header, Footer } from "@prepforall/marketing-ui/organisms";
import { getIcon } from "@/lib/icons";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = await content.navigation();

  const footerSocialLinks = nav.footer.socialLinks.map((link) => ({
    ...link,
    icon: getIcon(link.platform, "h-5 w-5"),
  }));

  return (
    <>
      <Header {...nav.header} />
      <main>{children}</main>
      <Footer
        logoSrc={nav.footer.logoSrc}
        tagline={nav.footer.tagline}
        columns={nav.footer.columns}
        socialLinks={footerSocialLinks}
        copyright={nav.footer.copyright}
      />
    </>
  );
}
```

- [ ] **7.3** Create `apps/marketing/app/(marketing)/page.tsx` -- homepage with all 10 sections:

```typescript
import { content } from "@/lib/content";
import { getIcon } from "@/lib/icons";
import {
  HeroBlock,
  StatsSection,
  OfferSection,
  ProductPreview,
  HowItWorks,
  UniversityPartners,
  TestimonialCarousel,
  PlacementLogos,
  CTASection,
} from "@prepforall/marketing-ui/organisms";
import { SectionWrapper, SectionHeading } from "@prepforall/marketing-ui/atomic";
import Image from "next/image";
import Link from "next/link";

export default async function HomePage() {
  const [homepage, testimonials, universities] = await Promise.all([
    content.homepage(),
    content.testimonials(),
    content.universities(),
  ]);

  const offers = homepage.offers.map((offer) => ({
    ...offer,
    icon: getIcon(offer.iconName),
  }));

  const steps = homepage.howItWorks.steps.map((step) => ({
    ...step,
    icon: getIcon(step.iconName),
  }));

  return (
    <>
      {/* Section 1: Hero */}
      <HeroBlock {...homepage.hero} />

      {/* Section 2: Stats */}
      <StatsSection stats={homepage.stats} />

      {/* Section 3: What We Offer */}
      <OfferSection
        heading="Everything your classroom needs"
        offers={offers}
      />

      {/* Section 4: Product Preview */}
      <ProductPreview
        heading={homepage.productPreview.heading}
        tabs={homepage.productPreview.tabs}
      />

      {/* Section 5: How It Works */}
      <HowItWorks heading={homepage.howItWorks.heading} steps={steps} />

      {/* Section 6: For Universities */}
      <SectionWrapper background="gray">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading align="left">
              {homepage.forUniversities.heading}
            </SectionHeading>
            <ul className="space-y-3">
              {homepage.forUniversities.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-gray-700">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {bullet}
                </li>
              ))}
            </ul>
            <Link
              href={homepage.forUniversities.ctaHref}
              className="mt-8 inline-block text-sm font-semibold text-brand-primary"
            >
              {homepage.forUniversities.ctaLabel} →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg">
            <Image
              src={homepage.forUniversities.screenshotSrc}
              alt="Trainer dashboard"
              width={640}
              height={400}
              className="w-full"
            />
          </div>
        </div>
      </SectionWrapper>

      {/* Section 7: University Partners */}
      <UniversityPartners
        heading="Trusted by universities across India"
        partners={universities.partners}
      />

      {/* Section 8: Testimonials */}
      <TestimonialCarousel
        heading={testimonials.heading}
        testimonials={testimonials.testimonials}
      />

      {/* Section 9: Placement Companies */}
      <PlacementLogos
        heading="Where our students get placed"
        companies={universities.placements}
      />

      {/* Section 10: Final CTA */}
      <CTASection {...homepage.cta} />
    </>
  );
}
```

- [ ] **7.4** Verify homepage renders:

```bash
cd apps/marketing && npx next dev --port 3001
# Visit http://localhost:3001 and verify all 10 sections render
```

Expected: Homepage renders all sections; no console errors; data from JSON content files displays correctly.

**Commit point:** `feat(marketing): build homepage with all 10 sections composed from marketing-ui organisms`

---

## Task 8: Problem Archive Pages

**Goal:** Build `/problems` list page and `/problems/[slug]` detail page with ISR, SEO (JSON-LD, meta), and sitemap integration.

### Files to Create
- `apps/marketing/app/(marketing)/problems/page.tsx`
- `apps/marketing/app/(marketing)/problems/[slug]/page.tsx`
- `apps/marketing/lib/api.ts`

### Steps

- [ ] **8.1** Create `apps/marketing/lib/api.ts` -- server-side data fetching for ISR:

```typescript
const API_URL = process.env.API_URL || "http://localhost:8080";

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  time_limit_ms: number;
  memory_limit_mb: number;
  acceptance_rate: number;
  total_submissions: number;
  is_public: boolean;
  created_at: string;
}

export async function getProblems(params?: {
  page?: number;
  difficulty?: string;
  q?: string;
}): Promise<Problem[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.difficulty) searchParams.set("difficulty", params.difficulty);
  if (params?.q) searchParams.set("q", params.q);

  const res = await fetch(`${API_URL}/api/v1/problems?${searchParams}`, {
    next: { revalidate: 3600 }, // ISR: revalidate every hour
  });

  if (!res.ok) return [];
  return res.json();
}

export async function getProblemBySlug(slug: string): Promise<Problem | null> {
  const res = await fetch(`${API_URL}/api/v1/problems/${slug}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  return res.json();
}

export async function getAllProblemSlugs(): Promise<string[]> {
  const problems = await getProblems({ page: 1 });
  // In production, implement pagination to fetch all slugs
  return problems.map((p) => p.slug);
}
```

- [ ] **8.2** Create `apps/marketing/app/(marketing)/problems/page.tsx`:

```typescript
import type { Metadata } from "next";
import Link from "next/link";
import { getProblems } from "@/lib/api";
import { SectionWrapper, SectionHeading } from "@prepforall/marketing-ui/atomic";
import { CTASection } from "@prepforall/marketing-ui/organisms";

export const metadata: Metadata = {
  title: "Problem Archive",
  description:
    "Browse 200+ coding problems across DSA and SQL. Practice with PrepForAll's curated problem set.",
};

const difficultyColors = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

interface Props {
  searchParams: Promise<{ page?: string; difficulty?: string; q?: string }>;
}

export default async function ProblemsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const problems = await getProblems({
    page,
    difficulty: params.difficulty,
    q: params.q,
  });

  return (
    <>
      <SectionWrapper background="white" className="!py-12">
        <SectionHeading subtitle="Browse our curated set of DSA and SQL problems">
          Problem Archive
        </SectionHeading>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {["All", "DSA", "SQL"].map((tab) => (
            <Link
              key={tab}
              href={tab === "All" ? "/problems" : `/problems?type=${tab.toLowerCase()}`}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
            >
              {tab}
            </Link>
          ))}
          <div className="ml-auto flex gap-2">
            {["easy", "medium", "hard"].map((d) => (
              <Link
                key={d}
                href={`/problems?difficulty=${d}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${difficultyColors[d as keyof typeof difficultyColors]}`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Link>
            ))}
          </div>
        </div>

        {/* Problem table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500">#</th>
                <th className="px-6 py-3 font-medium text-gray-500">Title</th>
                <th className="px-6 py-3 font-medium text-gray-500">Difficulty</th>
                <th className="px-6 py-3 font-medium text-gray-500">Tags</th>
                <th className="px-6 py-3 font-medium text-gray-500">Acceptance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {problems.map((problem, index) => (
                <tr key={problem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">
                    {(page - 1) * 20 + index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="font-medium text-gray-900 hover:text-brand-primary"
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        difficultyColors[problem.difficulty]
                      }`}
                    >
                      {problem.difficulty.charAt(0).toUpperCase() +
                        problem.difficulty.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {(problem.acceptance_rate * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/problems?page=${page - 1}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              Previous
            </Link>
          )}
          {problems.length === 20 && (
            <Link
              href={`/problems?page=${page + 1}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              Next
            </Link>
          )}
        </div>
      </SectionWrapper>

      <CTASection
        heading="Want to solve these problems? Get access through your university."
        ctaLabel="Request a Demo"
        ctaHref="/for-universities"
      />
    </>
  );
}
```

- [ ] **8.3** Create `apps/marketing/app/(marketing)/problems/[slug]/page.tsx`:

```typescript
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProblemBySlug, getAllProblemSlugs } from "@/lib/api";
import { SectionWrapper } from "@prepforall/marketing-ui/atomic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllProblemSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const problem = await getProblemBySlug(slug);
  if (!problem) return {};

  const description = problem.description
    ? problem.description.slice(0, 150) + "..."
    : `Solve ${problem.title} on PrepForAll`;

  return {
    title: problem.title,
    description,
    openGraph: {
      title: `${problem.title} - PrepForAll`,
      description,
      url: `https://prepforall.com/problems/${slug}`,
    },
    alternates: {
      canonical: `https://prepforall.com/problems/${slug}`,
    },
  };
}

const difficultyColors = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

export default async function ProblemPage({ params }: Props) {
  const { slug } = await params;
  const problem = await getProblemBySlug(slug);
  if (!problem) notFound();

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: problem.title,
    description: problem.description,
    educationalLevel: problem.difficulty,
    about: problem.tags,
    provider: {
      "@type": "Organization",
      name: "PrepForAll",
      url: "https://prepforall.com",
    },
    url: `https://prepforall.com/problems/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SectionWrapper background="white" className="!py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
          {/* Problem content */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <h1 className="font-heading text-3xl font-bold text-gray-900">
                {problem.title}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  difficultyColors[problem.difficulty]
                }`}
              >
                {problem.difficulty.charAt(0).toUpperCase() +
                  problem.difficulty.slice(1)}
              </span>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose prose-gray max-w-none">
              <div dangerouslySetInnerHTML={{ __html: problem.description }} />
            </div>

            <div className="mt-8">
              <Link
                href={`${process.env.NEXT_PUBLIC_PLATFORM_URL || "https://app.prepforall.com"}/problems/${slug}`}
                className="inline-block rounded-lg bg-brand-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
              >
                Login to Start Coding
              </Link>
            </div>
          </div>

          {/* Sidebar meta */}
          <div className="rounded-xl border border-gray-200 p-6">
            <h2 className="mb-4 font-semibold text-gray-900">Problem Info</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-gray-500">Acceptance Rate</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {(problem.acceptance_rate * 100).toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Total Submissions</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {problem.total_submissions.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Time Limit</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {problem.time_limit_ms}ms
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Memory Limit</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {problem.memory_limit_mb}MB
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
```

- [ ] **8.4** Verify problem pages render with mock data or dev API:

```bash
cd apps/marketing && npx next dev --port 3001
# Visit http://localhost:3001/problems — should show problem table
# Visit http://localhost:3001/problems/two-sum — should show problem detail with JSON-LD
```

Expected: Both pages render; JSON-LD visible in page source; meta tags populated.

**Commit point:** `feat(marketing): add problem archive pages with ISR, SEO, and JSON-LD structured data`

---

## Task 9: For Universities Page + Request Demo Form

**Goal:** Build the `/for-universities` page with Server Action for form submission.

### Files to Create
- `apps/marketing/app/(marketing)/for-universities/page.tsx`
- `apps/marketing/app/(marketing)/for-universities/actions.ts`

### Steps

- [ ] **9.1** Create `apps/marketing/app/(marketing)/for-universities/actions.ts`:

```typescript
"use server";

const API_URL = process.env.API_URL || "http://localhost:8080";

export interface DemoRequestState {
  success: boolean;
  error?: string;
}

export async function submitDemoRequest(
  _prevState: DemoRequestState,
  formData: FormData
): Promise<DemoRequestState> {
  const data = {
    institution: formData.get("institution") as string,
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    studentCount: formData.get("studentCount") as string,
    message: formData.get("message") as string,
  };

  // Validate required fields
  if (!data.institution || !data.name || !data.email) {
    return { success: false, error: "Please fill in all required fields." };
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/demo-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      return { success: false, error: "Something went wrong. Please try again." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error. Please try again later." };
  }
}
```

- [ ] **9.2** Create `apps/marketing/app/(marketing)/for-universities/page.tsx`:

```typescript
import type { Metadata } from "next";
import Image from "next/image";
import { content } from "@/lib/content";
import { getIcon } from "@/lib/icons";
import {
  SectionWrapper,
  SectionHeading,
} from "@prepforall/marketing-ui/atomic";
import {
  HowItWorks,
  UniversityPartners,
} from "@prepforall/marketing-ui/organisms";
import { DemoForm } from "./DemoForm";

export const metadata: Metadata = {
  title: "For Universities",
  description:
    "Partner with PrepForAll for coding training, assessments, and placement preparation. Request a demo today.",
};

export default async function ForUniversitiesPage() {
  const [homepage, universities] = await Promise.all([
    content.homepage(),
    content.universities(),
  ]);

  const steps = homepage.howItWorks.steps.map((step) => ({
    ...step,
    icon: getIcon(step.iconName),
  }));

  const deliverables = [
    {
      title: "Coding Platform",
      description:
        "200+ DSA & SQL problems, LeetCode-grade editor, 6 languages supported.",
      screenshotSrc: "/images/features/editor.png",
    },
    {
      title: "Test & Assessment Engine",
      description:
        "Timed tests, batch assignment, company-specific prep (TCS, Infosys, Cognizant).",
      screenshotSrc: "/images/features/tests.png",
    },
    {
      title: "Analytics Dashboard",
      description:
        "Student progress, batch reports, at-risk flags, NAAC/NIRF exports.",
      screenshotSrc: "/images/features/analytics.png",
    },
  ];

  const inclusions = [
    "Full platform access for trainers and students",
    "Trainer onboarding session",
    "Co-branded certificates",
    "Pre-built test templates",
    "Exportable NAAC/NIRF reports",
    "Priority support from our team",
  ];

  return (
    <>
      {/* Hero */}
      <SectionWrapper background="white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-4xl font-bold text-gray-900 md:text-5xl">
            Partner with PrepForAll
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            Equip your students with industry-grade coding practice, timed
            assessments, and analytics that impress accreditation bodies.
          </p>
          <a
            href="#demo-form"
            className="mt-8 inline-block rounded-lg bg-brand-primary px-8 py-3 text-sm font-semibold text-white"
          >
            Request a Demo ↓
          </a>
        </div>
      </SectionWrapper>

      {/* What We Deliver */}
      {deliverables.map((item, index) => (
        <SectionWrapper
          key={item.title}
          background={index % 2 === 0 ? "gray" : "white"}
        >
          <div
            className={`grid items-center gap-12 lg:grid-cols-2 ${
              index % 2 === 1 ? "lg:[direction:rtl] lg:*:[direction:ltr]" : ""
            }`}
          >
            <div>
              <h2 className="font-heading text-2xl font-bold text-gray-900">
                {item.title}
              </h2>
              <p className="mt-4 text-gray-600">{item.description}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg">
              <Image
                src={item.screenshotSrc}
                alt={item.title}
                width={640}
                height={400}
                className="w-full"
              />
            </div>
          </div>
        </SectionWrapper>
      ))}

      {/* How It Works */}
      <HowItWorks heading="How it works" steps={steps} />

      {/* What's Included */}
      <SectionWrapper background="gray">
        <SectionHeading>What's included</SectionHeading>
        <div className="mx-auto grid max-w-2xl gap-4">
          {inclusions.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* University Partners */}
      <UniversityPartners
        heading="Trusted by universities across India"
        partners={universities.partners}
      />

      {/* Request a Demo Form */}
      <SectionWrapper background="white" id="demo-form">
        <SectionHeading subtitle="Fill out the form and we'll get back to you within 24 hours.">
          Request a Demo
        </SectionHeading>
        <div className="mx-auto max-w-lg">
          <DemoForm />
        </div>
      </SectionWrapper>
    </>
  );
}
```

- [ ] **9.3** Create `apps/marketing/app/(marketing)/for-universities/DemoForm.tsx` -- client component using useActionState:

```typescript
"use client";

import { useActionState } from "react";
import { ContactForm } from "@prepforall/marketing-ui/organisms";
import { submitDemoRequest, type DemoRequestState } from "./actions";

const initialState: DemoRequestState = { success: false };

const formFields = [
  { name: "institution" as const, label: "Institution Name", type: "text" as const, placeholder: "e.g. SRM University", required: true },
  { name: "name" as const, label: "Your Name", type: "text" as const, placeholder: "Full name", required: true },
  { name: "email" as const, label: "Email", type: "email" as const, placeholder: "you@university.edu", required: true },
  { name: "phone" as const, label: "Phone", type: "tel" as const, placeholder: "+91 98765 43210", required: false },
  {
    name: "studentCount" as const,
    label: "Number of Students",
    type: "select" as const,
    placeholder: "Select range",
    required: false,
    options: ["Under 100", "100–300", "300–500", "500+"],
  },
  { name: "message" as const, label: "Message", type: "textarea" as const, placeholder: "Tell us about your training needs...", required: false },
];

export function DemoForm() {
  const [state, formAction, isPending] = useActionState(
    submitDemoRequest,
    initialState
  );

  if (state.success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-lg font-semibold text-green-800">
          Thank you! We'll be in touch within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <>
      {state.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <ContactForm
        fields={formFields}
        submitLabel="Request a Demo"
        onSubmit={formAction}
        pending={isPending}
      />
    </>
  );
}
```

- [ ] **9.4** Verify:

```bash
cd apps/marketing && npx next dev --port 3001
# Visit http://localhost:3001/for-universities
# Scroll to form, fill fields, submit
```

Expected: Page renders all sections; form submits via Server Action; success message appears.

**Commit point:** `feat(marketing): add For Universities page with demo request form via Server Action`

---

## Task 10: Features, About, Pricing, Contact Pages

**Goal:** Build all remaining content pages.

### Files to Create
- `apps/marketing/app/(marketing)/features/page.tsx`
- `apps/marketing/app/(marketing)/about/page.tsx`
- `apps/marketing/app/(marketing)/pricing/page.tsx`
- `apps/marketing/app/(marketing)/contact/page.tsx`
- `apps/marketing/app/(marketing)/contact/actions.ts`
- `apps/marketing/app/(marketing)/contact/ContactPageForm.tsx`

### Steps

- [ ] **10.1** Create `apps/marketing/app/(marketing)/features/page.tsx`:

```typescript
import type { Metadata } from "next";
import Image from "next/image";
import { content } from "@/lib/content";
import { getIcon } from "@/lib/icons";
import { SectionWrapper, SectionHeading } from "@prepforall/marketing-ui/atomic";
import { CTASection } from "@prepforall/marketing-ui/organisms";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore PrepForAll's features: Monaco code editor, sandboxed execution, contests, test engine, analytics, and more.",
};

export default async function FeaturesPage() {
  const featuresData = await content.features();

  return (
    <>
      <SectionWrapper background="white">
        <SectionHeading subtitle="Everything you need to build coding excellence">
          {featuresData.heading}
        </SectionHeading>
      </SectionWrapper>

      {featuresData.features.map((feature, index) => (
        <SectionWrapper
          key={feature.title}
          background={index % 2 === 0 ? "gray" : "white"}
        >
          <div
            className={`grid items-center gap-12 lg:grid-cols-2 ${
              index % 2 === 1 ? "lg:[direction:rtl] lg:*:[direction:ltr]" : ""
            }`}
          >
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                  {getIcon(feature.iconName)}
                </div>
                <h2 className="font-heading text-2xl font-bold text-gray-900">
                  {feature.title}
                </h2>
                {feature.comingSoon && (
                  <span className="rounded-full bg-yellow-100 px-3 py-0.5 text-xs font-medium text-yellow-700">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg">
              <Image
                src={feature.screenshotSrc}
                alt={feature.title}
                width={640}
                height={400}
                className="w-full"
              />
            </div>
          </div>
        </SectionWrapper>
      ))}

      <CTASection
        heading="Ready to bring this to your classroom?"
        ctaLabel="Request a Demo"
        ctaHref="/for-universities"
      />
    </>
  );
}
```

- [ ] **10.2** Create `apps/marketing/app/(marketing)/about/page.tsx`:

```typescript
import type { Metadata } from "next";
import { SectionWrapper, SectionHeading } from "@prepforall/marketing-ui/atomic";
import { FeatureCard } from "@prepforall/marketing-ui/molecular";
import { CTASection } from "@prepforall/marketing-ui/organisms";
import { getIcon } from "@/lib/icons";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about PrepForAll's mission to bridge the academia-industry gap in CS education.",
};

const values = [
  {
    iconName: "Shield",
    title: "Quality",
    description: "Every problem, feature, and integration meets the standard we'd want for ourselves.",
  },
  {
    iconName: "Users",
    title: "Transparency",
    description: "Simple pricing, honest partnerships, and clear communication with every stakeholder.",
  },
  {
    iconName: "GraduationCap",
    title: "Student-first",
    description: "Every decision starts with 'How does this help the student succeed?'",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <SectionWrapper background="white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-4xl font-bold text-gray-900 md:text-5xl">
            We're building the platform we wish we had in college.
          </h1>
        </div>
      </SectionWrapper>

      {/* Story */}
      <SectionWrapper background="gray">
        <SectionHeading>Our Story</SectionHeading>
        <div className="prose prose-gray mx-auto max-w-3xl">
          <p>
            PrepForAll started from a simple observation: universities across India
            lack access to production-quality coding practice tools. While platforms
            like LeetCode serve individual learners, there was nothing purpose-built
            for the university training workflow.
          </p>
          <p>
            We set out to build a platform that gives training partners and
            universities the same caliber of tools that top tech companies use for
            hiring — but designed around the classroom, not the individual.
          </p>
          <p>
            Today, PrepForAll powers coding training across multiple universities and
            training partners, helping hundreds of students prepare for placements
            with confidence.
          </p>
        </div>
      </SectionWrapper>

      {/* Mission */}
      <SectionWrapper background="white">
        <SectionHeading subtitle="Bridging the academia-industry gap in CS education.">
          Our Mission
        </SectionHeading>
      </SectionWrapper>

      {/* Values */}
      <SectionWrapper background="gray">
        <SectionHeading>Our Values</SectionHeading>
        <div className="grid gap-8 md:grid-cols-3">
          {values.map((value) => (
            <FeatureCard
              key={value.title}
              icon={getIcon(value.iconName)}
              title={value.title}
              description={value.description}
            />
          ))}
        </div>
      </SectionWrapper>

      <CTASection
        heading="Want to work with us?"
        ctaLabel="Contact Us"
        ctaHref="/contact"
      />
    </>
  );
}
```

- [ ] **10.3** Create `apps/marketing/app/(marketing)/pricing/page.tsx`:

```typescript
import type { Metadata } from "next";
import { content } from "@/lib/content";
import { SectionWrapper, SectionHeading } from "@prepforall/marketing-ui/atomic";
import { PricingBlock } from "@prepforall/marketing-ui/organisms";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for institutions. Choose the plan that fits your university.",
};

export default async function PricingPage() {
  const [pricingData, faqData] = await Promise.all([
    content.pricing(),
    content.faq(),
  ]);

  return (
    <>
      <PricingBlock
        heading={pricingData.heading}
        subtitle={pricingData.subtitle}
        tiers={pricingData.tiers}
      />

      {/* FAQ Accordion */}
      <SectionWrapper background="gray">
        <SectionHeading>Frequently Asked Questions</SectionHeading>
        <div className="mx-auto max-w-3xl space-y-4">
          {faqData.items.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-gray-200 bg-white"
            >
              <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-gray-900">
                {item.question}
                <svg
                  className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="border-t border-gray-100 px-6 py-4 text-sm text-gray-600">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </SectionWrapper>
    </>
  );
}
```

- [ ] **10.4** Create `apps/marketing/app/(marketing)/contact/actions.ts`:

```typescript
"use server";

const API_URL = process.env.API_URL || "http://localhost:8080";

export interface ContactFormState {
  success: boolean;
  error?: string;
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    subject: formData.get("subject") as string,
    message: formData.get("message") as string,
  };

  if (!data.name || !data.email || !data.message) {
    return { success: false, error: "Please fill in all required fields." };
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      return { success: false, error: "Something went wrong." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error." };
  }
}
```

- [ ] **10.5** Create `apps/marketing/app/(marketing)/contact/ContactPageForm.tsx`:

```typescript
"use client";

import { useActionState } from "react";
import { ContactForm } from "@prepforall/marketing-ui/organisms";
import { submitContactForm, type ContactFormState } from "./actions";

const initialState: ContactFormState = { success: false };

const formFields = [
  { name: "name" as const, label: "Name", type: "text" as const, placeholder: "Your name", required: true },
  { name: "email" as const, label: "Email", type: "email" as const, placeholder: "you@example.com", required: true },
  { name: "subject" as const, label: "Subject", type: "text" as const, placeholder: "How can we help?", required: false },
  { name: "message" as const, label: "Message", type: "textarea" as const, placeholder: "Your message...", required: true },
];

export function ContactPageForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState
  );

  if (state.success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-lg font-semibold text-green-800">
          Message sent! We'll respond within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <>
      {state.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <ContactForm
        fields={formFields}
        submitLabel="Send Message"
        onSubmit={formAction}
        pending={isPending}
      />
    </>
  );
}
```

- [ ] **10.6** Create `apps/marketing/app/(marketing)/contact/page.tsx`:

```typescript
import type { Metadata } from "next";
import { SectionWrapper, SectionHeading } from "@prepforall/marketing-ui/atomic";
import { Mail, Phone, MapPin } from "lucide-react";
import { ContactPageForm } from "./ContactPageForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the PrepForAll team.",
};

export default function ContactPage() {
  return (
    <SectionWrapper background="white">
      <SectionHeading>Get in touch</SectionHeading>
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Info */}
        <div>
          <p className="mb-8 text-gray-600">
            Have a question or want to learn more? Reach out and we'll get
            back to you within 24 hours.
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Mail className="mt-1 h-5 w-5 text-brand-primary" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <a href="mailto:hello@prepforall.com" className="text-sm text-gray-600 hover:text-brand-primary">
                  hello@prepforall.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="mt-1 h-5 w-5 text-brand-primary" />
              <div>
                <p className="font-medium text-gray-900">Phone</p>
                <a href="tel:+919876543210" className="text-sm text-gray-600 hover:text-brand-primary">
                  +91 98765 43210
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 h-5 w-5 text-brand-primary" />
              <div>
                <p className="font-medium text-gray-900">Office</p>
                <p className="text-sm text-gray-600">Chennai, Tamil Nadu, India</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <ContactPageForm />
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **10.7** Verify all pages:

```bash
cd apps/marketing && npx next dev --port 3001
# Visit /features, /about, /pricing, /contact — all should render
```

Expected: All four pages render without errors.

**Commit point:** `feat(marketing): add Features, About, Pricing, and Contact pages`

---

## Task 11: Privacy + Terms Pages

**Goal:** Build static legal pages.

### Files to Create
- `apps/marketing/app/(marketing)/privacy/page.tsx`
- `apps/marketing/app/(marketing)/terms/page.tsx`

### Steps

- [ ] **11.1** Create `apps/marketing/app/(marketing)/privacy/page.tsx`:

```typescript
import type { Metadata } from "next";
import { SectionWrapper } from "@prepforall/marketing-ui/atomic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "PrepForAll privacy policy.",
};

export default function PrivacyPage() {
  return (
    <SectionWrapper background="white">
      <div className="prose prose-gray mx-auto max-w-3xl">
        <h1>Privacy Policy</h1>
        <p className="text-gray-500">Last updated: April 2026</p>

        <h2>1. Information We Collect</h2>
        <p>
          We collect information that your university or training partner provides
          when enrolling you on the platform, including your name, email address,
          and institutional affiliation.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          Your information is used to provide the PrepForAll platform services,
          including delivering coding practice, assessments, and analytics to you
          and your institution.
        </p>

        <h2>3. Data Sharing</h2>
        <p>
          We share performance analytics with your institution's authorized
          trainers and administrators. We do not sell your data to third parties.
        </p>

        <h2>4. Data Security</h2>
        <p>
          We use industry-standard encryption and security practices to protect
          your data, including encrypted connections and secure infrastructure.
        </p>

        <h2>5. Contact</h2>
        <p>
          For privacy-related questions, contact us at{" "}
          <a href="mailto:privacy@prepforall.com">privacy@prepforall.com</a>.
        </p>
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **11.2** Create `apps/marketing/app/(marketing)/terms/page.tsx`:

```typescript
import type { Metadata } from "next";
import { SectionWrapper } from "@prepforall/marketing-ui/atomic";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "PrepForAll terms of service.",
};

export default function TermsPage() {
  return (
    <SectionWrapper background="white">
      <div className="prose prose-gray mx-auto max-w-3xl">
        <h1>Terms of Service</h1>
        <p className="text-gray-500">Last updated: April 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing PrepForAll, you agree to these terms. Access is provided
          through institutional partnerships — there is no public self-registration.
        </p>

        <h2>2. Platform Usage</h2>
        <p>
          You agree to use the platform for educational purposes only. Code
          submissions are executed in sandboxed environments and must not contain
          malicious content.
        </p>

        <h2>3. Intellectual Property</h2>
        <p>
          Problem content, editorial solutions, and platform design are the
          intellectual property of PrepForAll. Your code submissions remain yours.
        </p>

        <h2>4. Institutional Agreements</h2>
        <p>
          Access is governed by the MOU between PrepForAll and your institution.
          Specific terms may vary by partnership agreement.
        </p>

        <h2>5. Limitation of Liability</h2>
        <p>
          PrepForAll is provided "as is." We are not liable for service
          interruptions or data loss beyond our reasonable control.
        </p>

        <h2>6. Contact</h2>
        <p>
          Questions about these terms: <a href="mailto:legal@prepforall.com">legal@prepforall.com</a>.
        </p>
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **11.3** Verify both pages render:

```bash
cd apps/marketing && npx next dev --port 3001
# Visit /privacy and /terms
```

Expected: Both pages render with prose styling.

**Commit point:** `feat(marketing): add Privacy Policy and Terms of Service pages`

---

## Task 12: Navigation (Header/Footer with Routing)

**Goal:** Ensure Header and Footer are properly wired in the marketing layout with all navigation links working.

### Files to Modify
- `apps/marketing/app/(marketing)/layout.tsx` (already created in Task 7.2, may need updates)

### Steps

- [ ] **12.1** Verify the `(marketing)` layout includes Header and Footer from Task 7.2. Ensure navigation.json has all routes mapped correctly.

- [ ] **12.2** Add active link styling to Header. Update `packages/marketing-ui/src/organisms/Header.tsx` to accept a `currentPath` prop:

```typescript
// Add to HeaderProps:
currentPath?: string;

// In the navLink rendering, add active state:
className={`text-sm font-medium transition-colors ${
  link.href === currentPath
    ? "text-gray-900 font-semibold"
    : "text-gray-600 hover:text-gray-900"
}`}
```

- [ ] **12.3** Update `apps/marketing/app/(marketing)/layout.tsx` to pass current path using a client wrapper:

Create `apps/marketing/app/(marketing)/MarketingLayoutClient.tsx`:

```typescript
"use client";

import { usePathname } from "next/navigation";
import { Header, type HeaderProps } from "@prepforall/marketing-ui/organisms";

export function MarketingHeader(props: HeaderProps) {
  const pathname = usePathname();
  return <Header {...props} currentPath={pathname} />;
}
```

- [ ] **12.4** Smoke test all navigation links:

```bash
cd apps/marketing && npx next dev --port 3001
# Click through: Logo → /, Problems → /problems, Features → /features,
# For Universities → /for-universities, Login → external, Request Demo → /for-universities
# Footer links: all routes + external social links
```

Expected: All links navigate correctly; active link is highlighted; mobile menu works.

**Commit point:** `feat(marketing): wire Header and Footer navigation with active link styling`

---

## Task 13: SEO Setup

**Goal:** Configure next-sitemap, JSON-LD on all pages, Open Graph images, and robots.txt.

### Files to Create
- `apps/marketing/next-sitemap.config.js`
- `apps/marketing/app/robots.ts`
- `apps/marketing/app/sitemap.ts`

### Steps

- [ ] **13.1** Create `apps/marketing/next-sitemap.config.js`:

```javascript
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://prepforall.com",
  generateRobotsTxt: false, // We handle robots.ts separately
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ["/api/*"],
  additionalPaths: async (config) => {
    // Dynamic problem pages will be handled by app/sitemap.ts
    return [];
  },
};
```

- [ ] **13.2** Create `apps/marketing/app/robots.ts`:

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prepforall.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

- [ ] **13.3** Create `apps/marketing/app/sitemap.ts`:

```typescript
import type { MetadataRoute } from "next";
import { getAllProblemSlugs } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prepforall.com";

  // Static pages
  const staticPages = [
    "",
    "/features",
    "/problems",
    "/for-universities",
    "/about",
    "/pricing",
    "/contact",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic problem pages
  let problemPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllProblemSlugs();
    problemPages = slugs.map((slug) => ({
      url: `${baseUrl}/problems/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // API might not be available at build time
  }

  return [...staticPages, ...problemPages];
}
```

- [ ] **13.4** Add JSON-LD organization schema to root layout. Update `apps/marketing/app/layout.tsx`:

```typescript
// Add to the <head> (inside <html>):
<head>
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "PrepForAll",
        url: "https://prepforall.com",
        logo: "https://prepforall.com/images/logo.svg",
        description:
          "LeetCode-grade coding practice and placement preparation platform for universities.",
        contactPoint: {
          "@type": "ContactPoint",
          email: "hello@prepforall.com",
          contactType: "sales",
        },
      }),
    }}
  />
</head>
```

- [ ] **13.5** Add `postbuild` script to `apps/marketing/package.json`:

```json
"scripts": {
  "postbuild": "next-sitemap"
}
```

- [ ] **13.6** Verify SEO output:

```bash
cd apps/marketing && npx next dev --port 3001
# Visit http://localhost:3001/robots.txt — should show robots rules
# Visit http://localhost:3001/sitemap.xml — should list all pages
# View page source on /problems/two-sum — should contain JSON-LD script tag
```

Expected: robots.txt, sitemap.xml, and JSON-LD all present and valid.

**Commit point:** `feat(marketing): add SEO infrastructure — sitemap, robots.txt, JSON-LD structured data`

---

## Task 14: Performance Optimization

**Goal:** Ensure Lighthouse score >90 on all pages, LCP <2.5s, CLS <0.1, FID <100ms, and first load bundle <150KB.

### Files to Modify
- `apps/marketing/next.config.ts`
- `apps/marketing/app/layout.tsx`
- Various component files for optimization

### Steps

- [ ] **14.1** Configure image optimization in `apps/marketing/next.config.ts`. Add format and size constraints:

```typescript
// Add to nextConfig:
images: {
  formats: ["image/avif", "image/webp"],
  deviceSizes: [640, 750, 828, 1080, 1200],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
  remotePatterns: [
    { protocol: "https", hostname: "**.prepforall.com" },
  ],
},
```

- [ ] **14.2** Add dynamic imports for client-heavy components. Create `apps/marketing/lib/dynamic.ts`:

```typescript
import dynamic from "next/dynamic";

export const DynamicProductPreview = dynamic(
  () =>
    import("@prepforall/marketing-ui/organisms").then(
      (mod) => mod.ProductPreview
    ),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-xl bg-gray-100" /> }
);

export const DynamicTestimonialCarousel = dynamic(
  () =>
    import("@prepforall/marketing-ui/organisms").then(
      (mod) => mod.TestimonialCarousel
    ),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-gray-100" /> }
);
```

- [ ] **14.3** Add preconnect hints for fonts in layout:

```typescript
// In app/layout.tsx <head>:
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```

- [ ] **14.4** Add the infinite scroll keyframe animation to Tailwind config (already done in Task 5.4). Verify the `animate-scroll` CSS class works in `UniversityPartners`.

- [ ] **14.5** Ensure all images use proper `width`, `height`, `priority` (for above-the-fold), and `loading="lazy"` (for below-the-fold). Review all Image components in organisms.

- [ ] **14.6** Add bundle analyzer for monitoring:

```json
// In apps/marketing/package.json devDependencies:
"@next/bundle-analyzer": "^15.0.0"
```

```typescript
// In apps/marketing/next.config.ts:
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withAnalyzer(nextConfig);
```

- [ ] **14.7** Run Lighthouse audit:

```bash
cd apps/marketing && npx next build && npx next start
# Open Chrome DevTools → Lighthouse → Run audit on http://localhost:3000
```

Expected:
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90
- LCP: <2.5s
- CLS: <0.1

- [ ] **14.8** Verify bundle sizes:

```bash
cd apps/marketing && ANALYZE=true npx next build
```

Expected: First load JS per page < 150KB.

**Commit point:** `perf(marketing): optimize images, code splitting, and preconnect for Lighthouse >90`

---

## Summary of All Files

### packages/marketing-ui/ (17 files)
```
packages/marketing-ui/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── src/
    ├── index.ts
    ├── atomic/
    │   ├── index.ts
    │   ├── SectionWrapper.tsx
    │   ├── SectionHeading.tsx
    │   ├── SectionHeading.test.tsx
    │   ├── AnimatedCounter.tsx
    │   ├── AnimatedCounter.test.tsx
    │   └── BrandLogo.tsx
    ├── molecular/
    │   ├── index.ts
    │   ├── StatBar.tsx
    │   ├── TestimonialCard.tsx
    │   ├── PricingCard.tsx
    │   ├── PricingCard.test.tsx
    │   ├── FeatureCard.tsx
    │   ├── FeatureCard.test.tsx
    │   └── StepCard.tsx
    └── organisms/
        ├── index.ts
        ├── HeroBlock.tsx
        ├── HeroBlock.test.tsx
        ├── StatsSection.tsx
        ├── OfferSection.tsx
        ├── ProductPreview.tsx
        ├── HowItWorks.tsx
        ├── UniversityPartners.tsx
        ├── TestimonialCarousel.tsx
        ├── PlacementLogos.tsx
        ├── CTASection.tsx
        ├── PricingBlock.tsx
        ├── ContactForm.tsx
        ├── Header.tsx
        ├── Header.test.tsx
        └── Footer.tsx
```

### apps/marketing/ (30+ files)
```
apps/marketing/
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next-sitemap.config.js
├── .env.example
├── content/
│   ├── homepage.json
│   ├── testimonials.json
│   ├── pricing.json
│   ├── universities.json
│   ├── features.json
│   ├── faq.json
│   └── navigation.json
├── lib/
│   ├── content.ts
│   ├── api.ts
│   ├── fonts.ts
│   ├── metadata.ts
│   ├── icons.tsx
│   └── dynamic.ts
└── app/
    ├── layout.tsx
    ├── globals.css
    ├── not-found.tsx
    ├── robots.ts
    ├── sitemap.ts
    └── (marketing)/
        ├── layout.tsx
        ├── MarketingLayoutClient.tsx
        ├── page.tsx                          # Homepage
        ├── features/page.tsx
        ├── about/page.tsx
        ├── pricing/page.tsx
        ├── contact/
        │   ├── page.tsx
        │   ├── actions.ts
        │   └── ContactPageForm.tsx
        ├── for-universities/
        │   ├── page.tsx
        │   ├── actions.ts
        │   └── DemoForm.tsx
        ├── problems/
        │   ├── page.tsx
        │   └── [slug]/page.tsx
        ├── privacy/page.tsx
        └── terms/page.tsx
```

---

### Critical Files for Implementation

- `/Users/sahilsharma/education/prepforall/packages/marketing-ui/src/organisms/index.ts` -- barrel export for all organism components; the primary interface between marketing-ui package and apps/marketing
- `/Users/sahilsharma/education/prepforall/apps/marketing/app/(marketing)/page.tsx` -- homepage composing all 10 sections from marketing-ui organisms with content from JSON
- `/Users/sahilsharma/education/prepforall/apps/marketing/lib/content.ts` -- typed content loader that reads all JSON files; used by every page
- `/Users/sahilsharma/education/prepforall/apps/marketing/app/(marketing)/problems/[slug]/page.tsx` -- ISR problem detail page with JSON-LD, generateStaticParams, and SEO metadata
- `/Users/sahilsharma/education/prepforall/apps/marketing/next.config.ts` -- Next.js configuration with transpilePackages, image optimization, security headers, and bundle analyzer