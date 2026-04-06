# 03 — Marketing Site (apps/marketing)

> Content inspired by VTS and HitBullseye. Design style inspired by HubSpot — clean, generous whitespace, not crowded.

**Related specs:** [01-monorepo-and-tooling](01-monorepo-and-tooling.md), [02-design-system](02-design-system.md)
**References:** DTSL marketing-component-library (code reference for Atomic Design patterns)

---

## Design System

- Max content width: 1080px, centered
- Section padding: 80px vertical
- Headings: **DM Sans Bold** (clean sans-serif, tech-forward)
- Body text: **Inter Regular**
- Code snippets: **JetBrains Mono**
- One brand accent color + neutral palette
- Alternating white / light gray backgrounds per section
- One primary CTA per section
- Subtle scroll animations (fade-up, counter animations)

## Component Architecture

Marketing components live in `packages/marketing-ui/` (`@prepforall/marketing-ui`) — a separate package in the monorepo for separation of concerns. Composed from `@prepforall/react` primitives. Built referencing DTSL marketing-component-library patterns (CSS-first, Atomic Design hierarchy).

`apps/marketing/` contains only pages, routes, content, and page orchestration (data fetching, Server Actions, ISR) — no presentational components.

```
packages/marketing-ui/
└── src/
    ├── atomic/                  # Marketing-specific atoms (if any beyond @prepforall/react)
    ├── molecular/               # StatBar, TestimonialCard, PricingCard, FeatureCard, StepCard
    └── organisms/               # HeroBlock, StatsSection, OfferSection, ProductPreview,
                                 # HowItWorks, UniversityPartners, TestimonialCarousel,
                                 # PlacementLogos, CTASection, PricingBlock, ContactForm,
                                 # Header, Footer
```

**Dependency:** `@prepforall/marketing-ui` imports from `@prepforall/react` (shared primitives) and `@prepforall/tokens` (design tokens). `apps/marketing` imports from `@prepforall/marketing-ui`.

## Sitemap

```
prepforall.com/
├── /                       # Home (10 sections, detailed below)
├── /features               # Platform features — section per feature with screenshots
├── /problems               # Public problem archive (SEO — server-rendered list)
├── /problems/[slug]        # Problem preview page (SEO — title, difficulty, description excerpt)
├── /for-universities       # Partnership page + "Request Demo" form
├── /about                  # Team, mission, story
├── /contact                # Contact form
├── /pricing                # 3-tier pricing for institutions
├── /privacy                # Privacy policy
└── /terms                  # Terms of service
```

## Navigation

```
Logo    Problems  Features  For Universities  [Login]  [Request Demo]
```

- **Login** — redirects to `app.prepforall.com` (no auth on marketing site)
- **Request Demo** — links to `/for-universities` contact form
- No "Sign Up" button (B2B invite-only)

---

## Homepage — Section by Section

**Section 1: Hero** (white bg, two-column)
- Left: Heading "Build your coding skills, ace your placements." + subtext "Your end-to-end coding platform for practice, assessments & placement preparation." + two CTAs: [Request a Demo] (filled) and [Explore Problems →] (text link)
- Right: Product screenshot — problem workspace with a green AC verdict
- Typography: DM Sans Bold 48px heading, Inter 18px subtext

**Section 2: Stats bar** (accent/dark bg, slim single row)
- 4 animated counters on scroll: 200+ Problems | 8+ Partner Colleges | 500+ Students Trained | 95% Placement Confidence
- Numbers count up when section enters viewport

**Section 3: What We Offer** (white bg, 3 cards)
- Heading: "Everything your classroom needs"
- 3 cards with icons: Practice (200+ DSA & SQL problems, real code execution) | Assess (timed tests with proctoring, assign to batches) | Analyze (student & batch-wise analytics, track progress)
- Max 3 cards — clean, not crowded

**Section 4: Product preview** (light gray bg, tabbed screenshots)
- Heading: "A LeetCode-grade editor, inside your classroom"
- Tab selector: [Coding Platform] [Trainer Dashboard] [Analytics]
- One screenshot visible at a time, changes per tab click
- Clean browser mockup frame around screenshot

**Section 5: How It Works** (white bg, 5 numbered steps)
- Heading: "How PrepForAll works"
- Connected visual flow: ① Sign an MOU → ② Trainers get access → ③ Students enroll in batches → ④ Tests assigned to batches → ⑤ Track progress with analytics
- Icon per step, generous spacing

**Section 6: For Universities** (light gray bg, two-column)
- Left: "Built for training partners & universities" + bullet points (batch management, trainer dashboards, exportable reports for NAAC/NIRF, co-branded certificates, dedicated support) + [Learn More →] link to `/for-universities`
- Right: Screenshot of trainer dashboard with batch analytics

**Section 7: University partners** (white bg, logo bar)
- Heading: "Trusted by universities across India"
- Auto-scrolling logo bar: SRM, VIT, SASTRA, Manipal, NIT Trichy, PSG, CIT
- Color logos (not grayscale)

**Section 8: Testimonials** (light gray bg, single-card carousel)
- Heading: "What our partners say"
- One testimonial visible at a time with navigation dots
- Photo + name + role + institution
- Clean card design, not multiple cards side by side

**Section 9: Placement companies** (white bg, logo grid)
- Heading: "Where our students get placed"
- Company logos: Microsoft, Google, Amazon, TCS, Infosys, Wipro, Accenture, Deloitte, Cognizant, Capgemini
- Critical for university pitch credibility

**Section 10: Final CTA** (dark bg)
- "Ready to transform your classroom?"
- [Request a Demo] — single button, accent color

**Footer** (dark bg, continued)
- 4 columns: Brand (logo + tagline) | Product (Features, Problems, For Unis, Pricing) | Company (About, Contact) | Legal (Privacy, Terms)
- Social links: LinkedIn, Instagram, YouTube, Twitter
- © 2026 PrepForAll

---

## Public Problem Archive

### List page (`/problems`)

- Server-rendered table: #, Title, Difficulty (color-coded badge), Tags, Acceptance %
- Tabs: [All] [DSA] [SQL]
- Filters: Difficulty dropdown, Tags dropdown, Search text input
- Pagination (20 per page)
- Bottom CTA banner: "Want to solve these problems? Get access through your university. [Request a Demo]"
- No login required to browse — this is the SEO magnet

### Individual problem page (`/problems/[slug]`)

- Two-column: problem content left (title, difficulty badge, tags, description, example with input/output, constraints), meta right (acceptance %, submission count)
- Shows full problem statement including examples
- CTA: [Login to Start Coding] → redirects to `app.prepforall.com/problems/[slug]`
- Related problems section for internal linking
- Does NOT show editor or allow code submission

### SEO implementation

- `<title>`: "{Problem Title} - PrepForAll"
- `<meta description>`: "Solve {title} on PrepForAll. {description first 150 chars}..."
- JSON-LD structured data: `@type: LearningResource` with educationalLevel, about (tags), provider
- Open Graph tags for social sharing preview
- Canonical URL: `prepforall.com/problems/{slug}`
- Sitemap generated via `next-sitemap` with all problem slugs

---

## For Universities Page (`/for-universities`)

- **Hero**: "Partner with PrepForAll" + subtext + [Request a Demo ↓]
- **What We Deliver**: 3 alternating left-right sections with screenshots:
  1. Coding Platform — 200+ DSA & SQL problems, LeetCode-grade editor, 6 languages
  2. Test & Assessment Engine — timed tests, batch assignment, company-specific prep (TCS, Infosys, Cognizant)
  3. Analytics Dashboard — student progress, batch reports, at-risk flags, NAAC/NIRF exports
- **How It Works**: 5 numbered steps (Sign MOU → Trainers onboarded → Students enrolled → Tests assigned → Track & report)
- **What's Included**: checklist (platform access, trainer onboarding, co-branded certs, test templates, exportable reports, priority support)
- **Partner Logos**: university logos
- **Request a Demo form**: Institution Name, Your Name, Email, Phone, Number of Students, Message → Go API → stored in DB + notification email + WhatsApp link

## Features Page (`/features`)

One section per feature with alternating screenshot placement:
1. **Code Editor** — Monaco editor, multi-language, auto-complete, dark/light themes
2. **Sandboxed Execution** — gVisor isolation, 6 languages + SQL, instant verdicts
3. **Contests** — Rated contests, live leaderboards, ICPC/IOI style
4. **Test Engine** — Timed tests, batch assignment, proctoring, company-specific templates
5. **Analytics** — Topic breakdown, heatmaps, at-risk student flags, exportable reports
6. **Mock Interviews** (Coming Soon) — Video + collaborative coding

Final CTA: [Request a Demo]

## About Page (`/about`)

- Hero: "We're building the platform we wish we had in college."
- Our Story: 2-3 paragraphs on why PrepForAll exists
- Our Mission: Bridge academia-industry gap in CS education
- Team: 3-5 core team members with photos, roles, one-line bios
- Values: 3 cards (Quality, Transparency, Student-first)
- Final CTA: [Contact Us]

## Pricing Page (`/pricing`)

- Heading: "Simple, transparent pricing for institutions"
- 3 tiers: Starter (up to 100 students), Growth (up to 500, popular), Enterprise (unlimited)
- Feature comparison grid per tier
- All plans include: trainer onboarding, co-branded certs, exportable reports
- CTA per tier: [Contact for Quote] — no public pricing numbers (B2B negotiation)
- FAQ accordion below pricing cards

## Contact Page (`/contact`)

- Two-column: info left (email, phone, address, social links) + form right (Name, Email, Subject, Message, [Send Message])

---

## Technical Implementation

| Decision | Choice |
|---|---|
| Rendering | SSG + ISR (problems revalidate hourly, static pages on deploy) |
| Styling | Tailwind CSS + @prepforall/tokens design tokens |
| Typography | DM Sans (headings) + Inter (body) + JetBrains Mono (code) |
| Forms | Next.js Server Actions → Go API |
| Site Analytics | Plausible (self-hosted) or PostHog — privacy-friendly, no cookie banner |
| Problem data | ISR — fetched from Go API at build time, revalidated every hour |
| Sitemap | next-sitemap — auto-generates with all problem slugs |
| Content | Git-based JSON files in `content/` directory |
| Blog | Deferred — add later as MDX in `content/blog/` |

## Performance Targets

- Lighthouse score: >90 on all pages
- LCP: <2.5s
- CLS: <0.1
- FID: <100ms
- First load bundle: <150KB (code-split per page)

---

*Last updated: April 5, 2026*
