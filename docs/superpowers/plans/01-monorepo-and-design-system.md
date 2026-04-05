# Workstream A: Monorepo Setup + Design System -- Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing single-app repository into a Turborepo monorepo with shared config packages and a layered design system (tokens, CSS, icons, React primitives) that will be consumed by both the marketing site and platform app.

**Architecture:** The monorepo uses Turborepo with Yarn workspaces for dependency management and selective builds. The design system follows a Naos-inspired layered atomic architecture: `@prepforall/tokens` (CSS custom properties) flows into `@prepforall/css` (PostCSS + CSS modules), alongside `@prepforall/icons` (SVGR pipeline), which are all consumed by `@prepforall/react` (atomic/molecular/organism React components). Shared TypeScript configs, ESLint configs, PostCSS configs, and Tailwind presets live in `packages/config/*` to enforce consistency across all workspaces.

**Tech Stack:** Turborepo 2.x, Yarn 4 (Berry) workspaces, TypeScript 5.x, React 19, PostCSS 8, Tailwind CSS 3.4, SVGR 8, Storybook 8, Vitest, DM Sans + Inter + JetBrains Mono

---

## Current State Assessment

The repository currently has:
- `apps/web/` -- Next.js 15 app with npm (package-lock.json), Tailwind CSS, Radix UI, TanStack Query, Zustand
- `services/api/` and `services/judge/` -- Go services
- No root `package.json`, no `turbo.json`, no `packages/` directory
- No shared config packages
- Design tokens embedded inline in `apps/web/app/globals.css` as HSL CSS variables
- Components are in `apps/web/components/` (Navbar, Sidebar, CodeEditor, ProblemList, etc.) using Tailwind utility classes directly
- Node.js 20.19.0, Yarn 4.13.0 available

---

## Task 1: Root Monorepo Initialization

**Files to create:**
- `/Users/sahilsharma/education/prepforall/package.json` (root)
- `/Users/sahilsharma/education/prepforall/turbo.json`
- `/Users/sahilsharma/education/prepforall/.yarnrc.yml`
- `/Users/sahilsharma/education/prepforall/.npmrc`

**Files to modify:**
- `/Users/sahilsharma/education/prepforall/.gitignore`
- `/Users/sahilsharma/education/prepforall/apps/web/package.json`

### Steps

- [ ] **1.1** Initialize Yarn Berry in the root directory. Run `yarn init -2` in the repo root. This creates `.yarnrc.yml` and `.yarn/` directory.

- [ ] **1.2** Create the root `package.json` with workspaces configuration:

```json
{
  "name": "prepforall",
  "private": true,
  "packageManager": "yarn@4.13.0",
  "workspaces": [
    "apps/*",
    "packages/*",
    "packages/ui/*",
    "packages/config/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "build:css": "turbo run build:css",
    "build:react": "turbo run build:react",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "test:ci": "turbo run test:ci",
    "type-check": "turbo run type-check",
    "storybook": "turbo run storybook --filter=storybook",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.4.0"
  }
}
```

- [ ] **1.3** Create `turbo.json` with the pipeline from the spec:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "globalEnv": ["NODE_ENV"],
  "tasks": {
    "build:css": {
      "dependsOn": ["^build:css"],
      "outputs": ["dist/**"]
    },
    "build:icons": {
      "dependsOn": ["^build:icons"],
      "outputs": ["dist/**"]
    },
    "build:react": {
      "dependsOn": ["build:css", "build:icons", "^build:react"],
      "outputs": ["dist/**"]
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "test:ci": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    },
    "storybook": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **1.4** Configure `.yarnrc.yml` for nodeLinker (node-modules mode for compatibility):

```yaml
nodeLinker: node-modules
```

- [ ] **1.5** Update `.gitignore` to add monorepo-specific entries:

```gitignore
# Yarn Berry
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions
.pnp.*

# Turbo
.turbo/

# Build outputs
dist/

# Node (updated for monorepo)
node_modules/
.next/
out/

# ... (keep all existing entries)
```

- [ ] **1.6** Remove `apps/web/package-lock.json` (switching from npm to yarn). Update `apps/web/package.json` name to confirm it stays `@prepforall/web`.

- [ ] **1.7** Run `yarn install` from the root to generate `yarn.lock` and install all dependencies.

- [ ] **1.8** Verify turbo is working:

```bash
npx turbo run build --filter=@prepforall/web --dry
```

Expected: Turbo should detect the web workspace and show the dry-run task graph.

**Commit point:** `feat: initialize Turborepo monorepo with Yarn workspaces`

---

## Task 2: Shared Config Packages

**Files to create:**
- `packages/config/typescript/package.json`
- `packages/config/typescript/base.json`
- `packages/config/typescript/react-library.json`
- `packages/config/typescript/nextjs.json`
- `packages/config/typescript/vite.json`
- `packages/config/eslint/package.json`
- `packages/config/eslint/index.js`
- `packages/config/eslint/react.js`
- `packages/config/eslint/next.js`
- `packages/config/postcss/package.json`
- `packages/config/postcss/index.js`
- `packages/config/tailwind/package.json`
- `packages/config/tailwind/index.ts`

### Steps

- [ ] **2.1** Create `packages/config/typescript/package.json`:

```json
{
  "name": "@prepforall/typescript-config",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "files": ["*.json"]
}
```

- [ ] **2.2** Create `packages/config/typescript/base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "declaration": true,
    "declarationMap": true,
    "composite": false,
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext"
  },
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **2.3** Create `packages/config/typescript/react-library.json` (for packages/ui/* and packages/*-ui):

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

- [ ] **2.4** Create `packages/config/typescript/nextjs.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "noEmit": true,
    "plugins": [{ "name": "next" }]
  }
}
```

- [ ] **2.5** Create `packages/config/typescript/vite.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "noEmit": true
  }
}
```

- [ ] **2.6** Create `packages/config/eslint/package.json`:

```json
{
  "name": "@prepforall/eslint-config",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "main": "index.js",
  "files": ["*.js"],
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.0",
    "eslint-plugin-react": "^7.34.0",
    "eslint-plugin-react-hooks": "^4.6.0"
  },
  "peerDependencies": {
    "eslint": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **2.7** Create `packages/config/eslint/index.js` (base config):

```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "import"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "import/order": [
      "warn",
      {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
      },
    ],
  },
  ignorePatterns: ["dist/", "node_modules/", ".turbo/"],
};
```

- [ ] **2.8** Create `packages/config/eslint/react.js`:

```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "./index.js",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  plugins: ["react", "react-hooks"],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
  },
};
```

- [ ] **2.9** Create `packages/config/eslint/next.js`:

```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./react.js", "next/core-web-vitals"],
};
```

- [ ] **2.10** Create `packages/config/postcss/package.json`:

```json
{
  "name": "@prepforall/postcss-config",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "main": "index.js",
  "files": ["index.js"],
  "dependencies": {
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.38",
    "postcss-import": "^16.1.0",
    "postcss-nesting": "^13.0.0",
    "tailwindcss": "^3.4.1"
  }
}
```

- [ ] **2.11** Create `packages/config/postcss/index.js`:

```js
module.exports = {
  plugins: {
    "postcss-import": {},
    "tailwindcss/nesting": "postcss-nesting",
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **2.12** Create `packages/config/tailwind/package.json`:

```json
{
  "name": "@prepforall/tailwind-config",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "main": "index.ts",
  "files": ["index.ts"],
  "devDependencies": {
    "tailwindcss": "^3.4.1"
  }
}
```

- [ ] **2.13** Create `packages/config/tailwind/index.ts` -- shared Tailwind preset with design token integration:

```ts
import type { Config } from "tailwindcss";

const config: Partial<Config> = {
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      colors: {
        brand: {
          primary: "var(--color-brand-primary)",
          accent: "var(--color-brand-accent)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          raised: "var(--color-surface-raised)",
          overlay: "var(--color-surface-overlay)",
        },
        neutral: {
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
        },
        success: "var(--color-success)",
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        info: "var(--color-info)",
        // Keep existing shadcn-style tokens for backwards compat
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        "2xl": "var(--spacing-2xl)",
        "3xl": "var(--spacing-3xl)",
        section: "var(--spacing-section)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
};

export default config;
```

- [ ] **2.14** Run `yarn install` from root to link all config packages.

- [ ] **2.15** Verify all config packages resolve correctly:

```bash
yarn workspaces list
```

Expected: Should list `@prepforall/typescript-config`, `@prepforall/eslint-config`, `@prepforall/postcss-config`, `@prepforall/tailwind-config`, `@prepforall/web`.

**Commit point:** `feat: add shared config packages (typescript, eslint, postcss, tailwind)`

---

## Task 3: packages/shared (Types + Utils)

**Files to create:**
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/types/index.ts`
- `packages/shared/src/types/user.ts`
- `packages/shared/src/types/problem.ts`
- `packages/shared/src/types/submission.ts`
- `packages/shared/src/types/contest.ts`
- `packages/shared/src/types/organization.ts`
- `packages/shared/src/utils/index.ts`
- `packages/shared/src/utils/cn.ts`
- `packages/shared/src/utils/format.ts`
- `packages/shared/src/index.ts`
- `packages/shared/vitest.config.ts`
- `packages/shared/src/utils/__tests__/cn.test.ts`
- `packages/shared/src/utils/__tests__/format.test.ts`

### Steps

- [ ] **3.1** Create `packages/shared/package.json`:

```json
{
  "name": "@prepforall/shared",
  "version": "0.0.1",
  "private": true,
  "license": "MIT",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./utils": "./src/utils/index.ts"
  },
  "scripts": {
    "lint": "eslint src/",
    "test": "vitest run",
    "test:ci": "vitest run --coverage",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@prepforall/eslint-config": "workspace:*",
    "@prepforall/typescript-config": "workspace:*",
    "typescript": "^5.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **3.2** Create `packages/shared/tsconfig.json`:

```json
{
  "extends": "@prepforall/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/__tests__/**"]
}
```

- [ ] **3.3** Create `packages/shared/src/types/user.ts` -- Extract from `apps/web/types/index.ts`:

```ts
export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  rating: number;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

export type UserRole = "super_admin" | "org_admin" | "trainer" | "student";

export interface UserStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
}
```

- [ ] **3.4** Create `packages/shared/src/types/problem.ts`:

```ts
export interface Problem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  difficulty: Difficulty;
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  acceptanceRate: number;
  totalSubmissions: number;
  createdAt: string;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface TestCase {
  id: string;
  input: string;
  output: string;
  isSample: boolean;
}
```

- [ ] **3.5** Create `packages/shared/src/types/submission.ts`:

```ts
export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: string;
  verdict: Verdict;
  runtimeMs?: number;
  memoryKb?: number;
  passedCases: number;
  totalCases: number;
  errorMsg?: string;
  createdAt: string;
  judgedAt?: string;
}

export type Verdict = "PENDING" | "RUNNING" | "AC" | "WA" | "TLE" | "MLE" | "RE" | "CE";
```

- [ ] **3.6** Create `packages/shared/src/types/contest.ts`:

```ts
export interface Contest {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
}
```

- [ ] **3.7** Create `packages/shared/src/types/organization.ts`:

```ts
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Batch {
  id: string;
  organizationId: string;
  name: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}
```

- [ ] **3.8** Create `packages/shared/src/types/index.ts`:

```ts
export * from "./user";
export * from "./problem";
export * from "./submission";
export * from "./contest";
export * from "./organization";
```

- [ ] **3.9** Create `packages/shared/src/utils/cn.ts` -- move from `apps/web/lib/utils/cn.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **3.10** Create `packages/shared/src/utils/format.ts`:

```ts
/**
 * Format a number as a percentage string (e.g., 45.2%).
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format runtime in milliseconds (e.g., "12 ms", "1.2 s").
 */
export function formatRuntime(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

/**
 * Format memory in kilobytes (e.g., "256 KB", "1.2 MB").
 */
export function formatMemory(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Capitalize first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

- [ ] **3.11** Create `packages/shared/src/utils/index.ts`:

```ts
export { cn } from "./cn";
export { formatPercent, formatRuntime, formatMemory, capitalize } from "./format";
```

- [ ] **3.12** Create `packages/shared/src/index.ts`:

```ts
export * from "./types";
export * from "./utils";
```

- [ ] **3.13** Create `packages/shared/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

- [ ] **3.14** Write tests. Create `packages/shared/src/utils/__tests__/cn.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cn } from "../cn";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });
});
```

- [ ] **3.15** Create `packages/shared/src/utils/__tests__/format.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatPercent, formatRuntime, formatMemory, capitalize } from "../format";

describe("formatPercent", () => {
  it("formats with default decimals", () => {
    expect(formatPercent(45.23)).toBe("45.2%");
  });

  it("formats with custom decimals", () => {
    expect(formatPercent(45.23, 2)).toBe("45.23%");
  });
});

describe("formatRuntime", () => {
  it("formats milliseconds", () => {
    expect(formatRuntime(12)).toBe("12 ms");
  });

  it("formats seconds", () => {
    expect(formatRuntime(1234)).toBe("1.2 s");
  });
});

describe("formatMemory", () => {
  it("formats kilobytes", () => {
    expect(formatMemory(256)).toBe("256 KB");
  });

  it("formats megabytes", () => {
    expect(formatMemory(2048)).toBe("2.0 MB");
  });
});

describe("capitalize", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("easy")).toBe("Easy");
  });

  it("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });
});
```

- [ ] **3.16** Run tests:

```bash
yarn workspace @prepforall/shared test
```

Expected: All 10 tests pass.

- [ ] **3.17** Update `apps/web/package.json` to depend on `@prepforall/shared`:

Add `"@prepforall/shared": "workspace:*"` to dependencies. Update imports in `apps/web/types/index.ts` to re-export from `@prepforall/shared/types`, and update `apps/web/lib/utils/cn.ts` to re-export from `@prepforall/shared/utils`.

**Commit point:** `feat: add @prepforall/shared package with types and utils`

---

## Task 4: packages/ui/tokens (@prepforall/tokens)

**Files to create:**
- `packages/ui/tokens/package.json`
- `packages/ui/tokens/src/colors.css`
- `packages/ui/tokens/src/spacing.css`
- `packages/ui/tokens/src/typography.css`
- `packages/ui/tokens/src/radius.css`
- `packages/ui/tokens/src/shadows.css`
- `packages/ui/tokens/src/index.css`
- `packages/ui/tokens/postcss.config.js`

### Steps

- [ ] **4.1** Create `packages/ui/tokens/package.json`:

```json
{
  "name": "@prepforall/tokens",
  "version": "0.0.1",
  "private": true,
  "license": "MIT",
  "main": "./src/index.css",
  "exports": {
    ".": "./src/index.css",
    "./colors": "./src/colors.css",
    "./spacing": "./src/spacing.css",
    "./typography": "./src/typography.css"
  },
  "files": ["src/**/*.css"],
  "scripts": {
    "build:css": "echo 'tokens: raw CSS — no build step'",
    "clean": "echo 'tokens: nothing to clean'"
  }
}
```

- [ ] **4.2** Create `packages/ui/tokens/src/colors.css`:

```css
/* @prepforall/tokens — Color Palette
 * Semantic color tokens as CSS custom properties.
 * Consumed by @prepforall/css and Tailwind config.
 */
:root {
  /* Brand */
  --color-brand-primary: #2563eb;
  --color-brand-primary-hover: #1d4ed8;
  --color-brand-primary-light: #dbeafe;
  --color-brand-accent: #8b5cf6;
  --color-brand-accent-hover: #7c3aed;

  /* Neutrals */
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;
  --color-neutral-950: #020617;

  /* Surfaces */
  --color-surface: #ffffff;
  --color-surface-raised: #f8fafc;
  --color-surface-overlay: rgba(0, 0, 0, 0.5);

  /* Semantic */
  --color-success: #22c55e;
  --color-success-light: #dcfce7;
  --color-error: #ef4444;
  --color-error-light: #fee2e2;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-info: #3b82f6;
  --color-info-light: #dbeafe;

  /* Existing shadcn-compatible tokens (backwards compat with apps/web) */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --ring: 222.2 84% 4.9%;
}

.dark {
  /* Brand (same in dark) */
  --color-brand-primary: #3b82f6;
  --color-brand-primary-hover: #60a5fa;
  --color-brand-primary-light: #1e3a5f;
  --color-brand-accent: #a78bfa;
  --color-brand-accent-hover: #c4b5fd;

  /* Neutrals (inverted) */
  --color-neutral-50: #020617;
  --color-neutral-100: #0f172a;
  --color-neutral-200: #1e293b;
  --color-neutral-300: #334155;
  --color-neutral-400: #475569;
  --color-neutral-500: #64748b;
  --color-neutral-600: #94a3b8;
  --color-neutral-700: #cbd5e1;
  --color-neutral-800: #e2e8f0;
  --color-neutral-900: #f1f5f9;
  --color-neutral-950: #f8fafc;

  /* Surfaces */
  --color-surface: #0f172a;
  --color-surface-raised: #1e293b;
  --color-surface-overlay: rgba(0, 0, 0, 0.7);

  /* Semantic (same in dark) */
  --color-success: #4ade80;
  --color-success-light: #14532d;
  --color-error: #f87171;
  --color-error-light: #450a0a;
  --color-warning: #fbbf24;
  --color-warning-light: #451a03;
  --color-info: #60a5fa;
  --color-info-light: #172554;

  /* Existing shadcn-compatible tokens */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --border: 217.2 32.6% 17.5%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --ring: 212.7 26.8% 83.9%;
}
```

- [ ] **4.3** Create `packages/ui/tokens/src/spacing.css`:

```css
/* @prepforall/tokens — Spacing Scale */
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;
  --spacing-section: 80px;
}
```

- [ ] **4.4** Create `packages/ui/tokens/src/typography.css`:

```css
/* @prepforall/tokens — Typography
 * Font imports + type scale.
 * DM Sans (headings), Inter (body), JetBrains Mono (code).
 */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  /* Font families */
  --font-heading: 'DM Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Menlo', monospace;

  /* Font sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */

  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Font weights */
  --font-light: 300;
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

- [ ] **4.5** Create `packages/ui/tokens/src/radius.css`:

```css
/* @prepforall/tokens — Border Radius */
:root {
  --radius-sm: 4px;
  --radius: 0.5rem;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-full: 9999px;
}
```

- [ ] **4.6** Create `packages/ui/tokens/src/shadows.css`:

```css
/* @prepforall/tokens — Shadows */
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}
```

- [ ] **4.7** Create `packages/ui/tokens/src/index.css`:

```css
/* @prepforall/tokens — All design tokens */
@import "./colors.css";
@import "./spacing.css";
@import "./typography.css";
@import "./radius.css";
@import "./shadows.css";
```

- [ ] **4.8** Verify token files are valid CSS by checking imports resolve:

```bash
yarn workspace @prepforall/tokens build:css
```

Expected: Prints "tokens: raw CSS -- no build step" (success, tokens are raw CSS consumed by downstream packages).

**Commit point:** `feat: add @prepforall/tokens with colors, spacing, typography, radius, shadows`

---

## Task 5: packages/ui/css (@prepforall/css)

**Files to create:**
- `packages/ui/css/package.json`
- `packages/ui/css/tsconfig.json`
- `packages/ui/css/postcss.config.js`
- `packages/ui/css/src/base.css`
- `packages/ui/css/src/components/button.module.css`
- `packages/ui/css/src/components/input.module.css`
- `packages/ui/css/src/components/card.module.css`
- `packages/ui/css/src/components/badge.module.css`
- `packages/ui/css/src/components/modal.module.css`
- `packages/ui/css/src/components/tabs.module.css`
- `packages/ui/css/src/components/accordion.module.css`
- `packages/ui/css/src/components/toast.module.css`
- `packages/ui/css/src/components/avatar.module.css`
- `packages/ui/css/src/components/data-table.module.css`
- `packages/ui/css/src/components/sidebar.module.css`
- `packages/ui/css/src/components/navbar.module.css`
- `packages/ui/css/src/index.css`
- `packages/ui/css/scripts/build.js`

### Steps

- [ ] **5.1** Create `packages/ui/css/package.json`:

```json
{
  "name": "@prepforall/css",
  "version": "0.0.1",
  "private": true,
  "license": "MIT",
  "main": "./dist/index.css",
  "exports": {
    ".": "./dist/index.css",
    "./components/*": "./dist/components/*.module.css"
  },
  "files": ["dist/**/*.css"],
  "scripts": {
    "build:css": "node scripts/build.js",
    "dev": "node scripts/build.js --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@prepforall/tokens": "workspace:*"
  },
  "devDependencies": {
    "@prepforall/postcss-config": "workspace:*",
    "postcss": "^8.4.38",
    "postcss-cli": "^11.0.0",
    "postcss-modules": "^6.0.1",
    "glob": "^11.0.0"
  }
}
```

- [ ] **5.2** Create `packages/ui/css/postcss.config.js`:

```js
const baseConfig = require("@prepforall/postcss-config");

module.exports = {
  ...baseConfig,
  plugins: {
    ...baseConfig.plugins,
    "postcss-modules": {
      generateScopedName: "pfa-[name]__[local]--[hash:base64:5]",
      getJSON: () => {}, // handled by build script
    },
  },
};
```

- [ ] **5.3** Create `packages/ui/css/src/base.css`:

```css
/* @prepforall/css — Base styles
 * Imports tokens and sets up global resets.
 */
@import "@prepforall/tokens";

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--color-neutral-900);
  background-color: var(--color-surface);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.dark body {
  color: var(--color-neutral-900);
  background-color: var(--color-surface);
}
```

- [ ] **5.4** Create `packages/ui/css/src/components/button.module.css`:

```css
.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-family: var(--font-body);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, box-shadow 150ms ease;
  white-space: nowrap;
  user-select: none;
  border: none;
  outline: none;
}

.root:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}

.root:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Variants */
.primary {
  background-color: var(--color-brand-primary);
  color: white;
}
.primary:hover { background-color: var(--color-brand-primary-hover); }

.secondary {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-900);
}
.secondary:hover { background-color: var(--color-neutral-200); }

.ghost {
  background-color: transparent;
  color: var(--color-neutral-700);
}
.ghost:hover { background-color: var(--color-neutral-100); }

.destructive {
  background-color: var(--color-error);
  color: white;
}
.destructive:hover { background-color: #dc2626; }

.outline {
  background-color: transparent;
  color: var(--color-neutral-700);
  border: 1px solid var(--color-neutral-300);
}
.outline:hover { background-color: var(--color-neutral-50); }

/* Sizes */
.sm { padding: var(--spacing-xs) var(--spacing-sm); font-size: var(--text-xs); }
.md { padding: var(--spacing-sm) var(--spacing-md); font-size: var(--text-sm); }
.lg { padding: var(--spacing-sm) var(--spacing-lg); font-size: var(--text-base); }
.icon { padding: var(--spacing-sm); }
```

- [ ] **5.5** Create `packages/ui/css/src/components/input.module.css`:

```css
.root {
  display: flex;
  width: 100%;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-neutral-900);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.root::placeholder {
  color: var(--color-neutral-400);
}

.root:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 2px var(--color-brand-primary-light);
}

.root:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  border-color: var(--color-error);
}
.error:focus {
  box-shadow: 0 0 0 2px var(--color-error-light);
}

.wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-neutral-700);
}

.helperText {
  font-size: var(--text-xs);
  color: var(--color-neutral-500);
}

.errorText {
  font-size: var(--text-xs);
  color: var(--color-error);
}
```

- [ ] **5.6** Create remaining CSS module stubs for card, badge, modal, tabs, accordion, toast, avatar, data-table, sidebar, navbar. Each follows the same pattern with `.root` and variant classes. (Create minimal but functional CSS for each -- these expand in later workstreams.)

Create `packages/ui/css/src/components/card.module.css`:

```css
.root {
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-neutral-200);
  background-color: var(--color-surface);
  overflow: hidden;
}

.header { padding: var(--spacing-lg); }
.body { padding: 0 var(--spacing-lg) var(--spacing-lg); }
.footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-neutral-200);
}
```

Create `packages/ui/css/src/components/badge.module.css`:

```css
.root {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.default { background-color: var(--color-neutral-100); color: var(--color-neutral-700); }
.success { background-color: var(--color-success-light); color: var(--color-success); }
.error { background-color: var(--color-error-light); color: var(--color-error); }
.warning { background-color: var(--color-warning-light); color: var(--color-warning); }
.info { background-color: var(--color-info-light); color: var(--color-info); }
```

Create `packages/ui/css/src/components/modal.module.css`:

```css
.overlay {
  position: fixed;
  inset: 0;
  background-color: var(--color-surface-overlay);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  background-color: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
}

.close {
  cursor: pointer;
  background: none;
  border: none;
  padding: var(--spacing-xs);
  border-radius: var(--radius-md);
  color: var(--color-neutral-500);
}
.close:hover { background-color: var(--color-neutral-100); }
```

Create `packages/ui/css/src/components/tabs.module.css`:

```css
.list {
  display: flex;
  border-bottom: 1px solid var(--color-neutral-200);
  gap: 0;
}

.trigger {
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-neutral-500);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease;
}

.trigger:hover { color: var(--color-neutral-700); }
.triggerActive {
  color: var(--color-brand-primary);
  border-bottom-color: var(--color-brand-primary);
}

.content { padding: var(--spacing-md) 0; }
```

Create `packages/ui/css/src/components/accordion.module.css`:

```css
.root { border: 1px solid var(--color-neutral-200); border-radius: var(--radius-lg); overflow: hidden; }
.item { border-bottom: 1px solid var(--color-neutral-200); }
.item:last-child { border-bottom: none; }

.trigger {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}
.trigger:hover { background-color: var(--color-neutral-50); }

.content { padding: 0 var(--spacing-lg) var(--spacing-md); font-size: var(--text-sm); color: var(--color-neutral-600); }
```

Create `packages/ui/css/src/components/toast.module.css`:

```css
.root {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  min-width: 300px;
  max-width: 420px;
}

.success { background-color: var(--color-success-light); border-left: 4px solid var(--color-success); }
.error { background-color: var(--color-error-light); border-left: 4px solid var(--color-error); }
.warning { background-color: var(--color-warning-light); border-left: 4px solid var(--color-warning); }
.info { background-color: var(--color-info-light); border-left: 4px solid var(--color-info); }
```

Create `packages/ui/css/src/components/avatar.module.css`:

```css
.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--color-neutral-200);
  color: var(--color-neutral-600);
  font-family: var(--font-body);
  font-weight: var(--font-medium);
}

.sm { width: 32px; height: 32px; font-size: var(--text-xs); }
.md { width: 40px; height: 40px; font-size: var(--text-sm); }
.lg { width: 48px; height: 48px; font-size: var(--text-base); }

.image { width: 100%; height: 100%; object-fit: cover; }
```

Create `packages/ui/css/src/components/data-table.module.css`:

```css
.wrapper { overflow-x: auto; border: 1px solid var(--color-neutral-200); border-radius: var(--radius-lg); }

.table { width: 100%; border-collapse: collapse; font-family: var(--font-body); font-size: var(--text-sm); }

.thead { background-color: var(--color-neutral-50); }
.th {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  font-weight: var(--font-medium);
  color: var(--color-neutral-600);
  border-bottom: 1px solid var(--color-neutral-200);
  white-space: nowrap;
}

.td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-neutral-100);
}

.tr:hover { background-color: var(--color-neutral-50); }
```

Create `packages/ui/css/src/components/sidebar.module.css`:

```css
.root {
  display: flex;
  flex-direction: column;
  width: 56px;
  border-right: 1px solid var(--color-neutral-200);
  background-color: var(--color-surface);
  padding: var(--spacing-md) 0;
  flex-shrink: 0;
}

.expanded { width: 240px; }

.item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  margin: 0 var(--spacing-xs);
  color: var(--color-neutral-600);
  cursor: pointer;
  transition: background-color 150ms ease;
}
.item:hover { background-color: var(--color-neutral-100); }
.itemActive { background-color: var(--color-brand-primary-light); color: var(--color-brand-primary); }
```

Create `packages/ui/css/src/components/navbar.module.css`:

```css
.root {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 var(--spacing-lg);
  border-bottom: 1px solid var(--color-neutral-200);
  background-color: var(--color-surface);
}

.brand {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-brand-primary);
}

.nav { display: flex; align-items: center; gap: var(--spacing-lg); }

.link {
  font-size: var(--text-sm);
  color: var(--color-neutral-500);
  transition: color 150ms ease;
}
.link:hover { color: var(--color-neutral-900); }
.linkActive { color: var(--color-brand-primary); }

.actions { display: flex; align-items: center; gap: var(--spacing-sm); }
```

- [ ] **5.7** Create `packages/ui/css/src/index.css`:

```css
/* @prepforall/css — Aggregated stylesheet */
@import "./base.css";
```

- [ ] **5.8** Create `packages/ui/css/scripts/build.js` -- Simple PostCSS build script that processes all CSS files to `dist/`:

```js
const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const { glob } = require("glob");

const srcDir = path.resolve(__dirname, "../src");
const distDir = path.resolve(__dirname, "../dist");

async function build() {
  // Ensure dist directory exists
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(path.join(distDir, "components"), { recursive: true });

  // Copy base CSS
  const baseSrc = fs.readFileSync(path.join(srcDir, "index.css"), "utf-8");
  fs.writeFileSync(path.join(distDir, "index.css"), baseSrc);

  // Process component CSS modules
  const componentFiles = await glob("components/*.module.css", { cwd: srcDir });

  for (const file of componentFiles) {
    const srcPath = path.join(srcDir, file);
    const distPath = path.join(distDir, file);
    const css = fs.readFileSync(srcPath, "utf-8");
    fs.writeFileSync(distPath, css);
  }

  console.log(`@prepforall/css: Built ${componentFiles.length} component CSS modules`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **5.9** Run CSS build:

```bash
yarn workspace @prepforall/css build:css
```

Expected: `@prepforall/css: Built 10 component CSS modules`

**Commit point:** `feat: add @prepforall/css with PostCSS pipeline and component CSS modules`

---

## Task 6: packages/ui/icons (@prepforall/icons)

**Files to create:**
- `packages/ui/icons/package.json`
- `packages/ui/icons/tsconfig.json`
- `packages/ui/icons/svgr.config.js`
- `packages/ui/icons/scripts/build.js`
- `packages/ui/icons/src/svg/arrow-left.svg`
- `packages/ui/icons/src/svg/arrow-right.svg`
- `packages/ui/icons/src/svg/check.svg`
- `packages/ui/icons/src/svg/chevron-down.svg`
- `packages/ui/icons/src/svg/close.svg`
- `packages/ui/icons/src/svg/menu.svg`
- `packages/ui/icons/src/svg/search.svg`
- `packages/ui/icons/src/svg/sun.svg`
- `packages/ui/icons/src/svg/moon.svg`
- `packages/ui/icons/src/svg/user.svg`
- `packages/ui/icons/src/svg/code.svg`
- `packages/ui/icons/src/svg/trophy.svg`
- `packages/ui/icons/src/svg/chart-bar.svg`
- `packages/ui/icons/src/index.ts` (generated)

### Steps

- [ ] **6.1** Create `packages/ui/icons/package.json`:

```json
{
  "name": "@prepforall/icons",
  "version": "0.0.1",
  "private": true,
  "license": "MIT",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build:icons": "node scripts/build.js",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@prepforall/typescript-config": "workspace:*",
    "@svgr/core": "^8.1.0",
    "@svgr/plugin-jsx": "^8.1.0",
    "@svgr/plugin-svgo": "^8.1.0",
    "esbuild": "^0.24.0",
    "typescript": "^5.0.0",
    "glob": "^11.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

- [ ] **6.2** Create `packages/ui/icons/tsconfig.json`:

```json
{
  "extends": "@prepforall/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **6.3** Create `packages/ui/icons/svgr.config.js`:

```js
module.exports = {
  plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
  typescript: true,
  jsxRuntime: "automatic",
  svgoConfig: {
    plugins: [
      { name: "removeViewBox", active: false },
      { name: "removeDimensions", active: true },
    ],
  },
  svgProps: {
    "aria-hidden": "true",
    focusable: "false",
  },
  template: ({ componentName, jsx, imports }, { tpl }) => tpl`
    ${imports}
    import type { SVGProps } from "react";

    export interface ${componentName}Props extends SVGProps<SVGSVGElement> {
      size?: number | string;
    }

    export function ${componentName}({ size = 24, ...props }: ${componentName}Props) {
      return ${jsx};
    }
  `,
};
```

- [ ] **6.4** Create starter SVG files in `packages/ui/icons/src/svg/`. These are minimal 24x24 SVGs. Example `close.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18"/>
  <line x1="6" y1="6" x2="18" y2="18"/>
</svg>
```

Create similar minimal SVGs for each icon (arrow-left, arrow-right, check, chevron-down, menu, search, sun, moon, user, code, trophy, chart-bar). These can be sourced from Lucide SVGs or hand-crafted.

- [ ] **6.5** Create `packages/ui/icons/scripts/build.js`:

```js
const fs = require("fs");
const path = require("path");
const { transform } = require("@svgr/core");
const { glob } = require("glob");
const esbuild = require("esbuild");

const SVG_DIR = path.resolve(__dirname, "../src/svg");
const GENERATED_DIR = path.resolve(__dirname, "../src/generated");
const DIST_DIR = path.resolve(__dirname, "../dist");
const svgrConfig = require("../svgr.config.js");

function toPascalCase(str) {
  return str
    .replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
}

async function build() {
  // 1. Clean and create dirs
  fs.rmSync(GENERATED_DIR, { recursive: true, force: true });
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 2. Transform SVGs to React components
  const svgFiles = await glob("*.svg", { cwd: SVG_DIR });
  const exports = [];

  for (const file of svgFiles) {
    const name = path.basename(file, ".svg");
    const componentName = `Icon${toPascalCase(name)}`;
    const svgCode = fs.readFileSync(path.join(SVG_DIR, file), "utf-8");

    const tsxCode = await transform(svgCode, {
      ...svgrConfig,
      componentName,
    });

    fs.writeFileSync(
      path.join(GENERATED_DIR, `${componentName}.tsx`),
      tsxCode
    );
    exports.push(`export { ${componentName} } from "./${componentName}";`);
    exports.push(`export type { ${componentName}Props } from "./${componentName}";`);
  }

  // 3. Write index file
  const indexContent = exports.join("\n") + "\n";
  fs.writeFileSync(path.join(GENERATED_DIR, "index.ts"), indexContent);

  // Also write src/index.ts pointing to generated
  fs.writeFileSync(
    path.resolve(__dirname, "../src/index.ts"),
    'export * from "./generated";\n'
  );

  // 4. Bundle with esbuild
  const entryPoint = path.join(GENERATED_DIR, "index.ts");

  await esbuild.build({
    entryPoints: [entryPoint],
    outfile: path.join(DIST_DIR, "index.mjs"),
    bundle: true,
    format: "esm",
    target: "es2022",
    external: ["react", "react/jsx-runtime"],
    sourcemap: true,
  });

  await esbuild.build({
    entryPoints: [entryPoint],
    outfile: path.join(DIST_DIR, "index.js"),
    bundle: true,
    format: "cjs",
    target: "es2022",
    external: ["react", "react/jsx-runtime"],
    sourcemap: true,
  });

  console.log(`@prepforall/icons: Built ${svgFiles.length} icon components`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **6.6** Run icon build:

```bash
yarn workspace @prepforall/icons build:icons
```

Expected: `@prepforall/icons: Built 13 icon components`

- [ ] **6.7** Generate TypeScript declarations separately (esbuild does not emit `.d.ts`):

Add to the build script or as a separate step: `tsc --emitDeclarationOnly --declaration --outDir dist` with the tsconfig.

**Commit point:** `feat: add @prepforall/icons with SVGR pipeline (13 starter icons)`

---

## Task 7: packages/ui/react (@prepforall/react)

**Files to create:**
- `packages/ui/react/package.json`
- `packages/ui/react/tsconfig.json`
- `packages/ui/react/vitest.config.ts`
- `packages/ui/react/src/index.ts`
- Atomic components:
  - `packages/ui/react/src/atomic/Button/Button.tsx`
  - `packages/ui/react/src/atomic/Button/Button.test.tsx`
  - `packages/ui/react/src/atomic/Button/index.ts`
  - `packages/ui/react/src/atomic/Input/Input.tsx`
  - `packages/ui/react/src/atomic/Input/Input.test.tsx`
  - `packages/ui/react/src/atomic/Input/index.ts`
  - `packages/ui/react/src/atomic/Badge/Badge.tsx`
  - `packages/ui/react/src/atomic/Badge/index.ts`
  - `packages/ui/react/src/atomic/Avatar/Avatar.tsx`
  - `packages/ui/react/src/atomic/Avatar/index.ts`
- Molecular components:
  - `packages/ui/react/src/molecular/Card/Card.tsx`
  - `packages/ui/react/src/molecular/Card/index.ts`
  - `packages/ui/react/src/molecular/Modal/Modal.tsx`
  - `packages/ui/react/src/molecular/Modal/index.ts`
  - `packages/ui/react/src/molecular/Tabs/Tabs.tsx`
  - `packages/ui/react/src/molecular/Tabs/index.ts`
  - `packages/ui/react/src/molecular/Accordion/Accordion.tsx`
  - `packages/ui/react/src/molecular/Accordion/index.ts`
  - `packages/ui/react/src/molecular/Toast/Toast.tsx`
  - `packages/ui/react/src/molecular/Toast/index.ts`
- Organism components:
  - `packages/ui/react/src/organisms/DataTable/DataTable.tsx`
  - `packages/ui/react/src/organisms/DataTable/index.ts`
  - `packages/ui/react/src/organisms/Sidebar/Sidebar.tsx`
  - `packages/ui/react/src/organisms/Sidebar/index.ts`
  - `packages/ui/react/src/organisms/Navbar/Navbar.tsx`
  - `packages/ui/react/src/organisms/Navbar/index.ts`

### Steps

- [ ] **7.1** Create `packages/ui/react/package.json`:

```json
{
  "name": "@prepforall/react",
  "version": "0.0.1",
  "private": true,
  "license": "MIT",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./atomic/*": "./src/atomic/*/index.ts",
    "./molecular/*": "./src/molecular/*/index.ts",
    "./organisms/*": "./src/organisms/*/index.ts"
  },
  "scripts": {
    "build:react": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint src/",
    "test": "vitest run",
    "test:ci": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@prepforall/tokens": "workspace:*",
    "@prepforall/icons": "workspace:*",
    "@prepforall/shared": "workspace:*",
    "class-variance-authority": "^0.7.1"
  },
  "devDependencies": {
    "@prepforall/eslint-config": "workspace:*",
    "@prepforall/typescript-config": "workspace:*",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.0.0",
    "vitest": "^3.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

- [ ] **7.2** Create `packages/ui/react/tsconfig.json`:

```json
{
  "extends": "@prepforall/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

- [ ] **7.3** Create `packages/ui/react/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

- [ ] **7.4** Create `packages/ui/react/src/test-setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **7.5** Create `packages/ui/react/src/atomic/Button/Button.tsx`:

```tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@prepforall/shared/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)]",
        secondary: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-200)]",
        ghost: "bg-transparent text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]",
        destructive: "bg-[var(--color-error)] text-white hover:bg-red-600",
        outline: "border border-[var(--color-neutral-300)] text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Show a loading spinner and disable the button */
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };
```

- [ ] **7.6** Create `packages/ui/react/src/atomic/Button/Button.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { Button } from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("fires onClick handler", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("applies variant classes", () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass("bg-[var(--color-error)]");
  });
});
```

- [ ] **7.7** Create `packages/ui/react/src/atomic/Button/index.ts`:

```ts
export { Button, buttonVariants } from "./Button";
export type { ButtonProps } from "./Button";
```

- [ ] **7.8** Create `packages/ui/react/src/atomic/Input/Input.tsx`:

```tsx
import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@prepforall/shared/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message (replaces helperText, adds error styling) */
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-neutral-700)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex w-full rounded-md border border-[var(--color-neutral-300)] bg-[var(--color-surface)] px-3 py-2 text-sm placeholder:text-[var(--color-neutral-400)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary-light)] disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-[var(--color-error)] focus:ring-[var(--color-error-light)]",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[var(--color-error)]" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-[var(--color-neutral-500)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
```

- [ ] **7.9** Create `packages/ui/react/src/atomic/Input/Input.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Input } from "./Input";

describe("Input", () => {
  it("renders with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Input label="Email" error="Required field" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required field");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows helper text when no error", () => {
    render(<Input label="Email" helperText="Enter your email" />);
    expect(screen.getByText("Enter your email")).toBeInTheDocument();
  });
});
```

- [ ] **7.10** Create `packages/ui/react/src/atomic/Input/index.ts`:

```ts
export { Input } from "./Input";
export type { InputProps } from "./Input";
```

- [ ] **7.11** Create `packages/ui/react/src/atomic/Badge/Badge.tsx`:

```tsx
import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@prepforall/shared/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
        success: "bg-[var(--color-success-light)] text-[var(--color-success)]",
        error: "bg-[var(--color-error-light)] text-[var(--color-error)]",
        warning: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
        info: "bg-[var(--color-info-light)] text-[var(--color-info)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

- [ ] **7.12** Create `packages/ui/react/src/atomic/Badge/index.ts`:

```ts
export { Badge, badgeVariants } from "./Badge";
export type { BadgeProps } from "./Badge";
```

- [ ] **7.13** Create `packages/ui/react/src/atomic/Avatar/Avatar.tsx`:

```tsx
import { type ImgHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@prepforall/shared/utils";

const avatarVariants = cva(
  "inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 bg-[var(--color-neutral-200)] text-[var(--color-neutral-600)] font-medium",
  {
    variants: {
      size: {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface AvatarProps
  extends VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
}

export function Avatar({ src, alt, fallback, size, className }: AvatarProps) {
  return (
    <span className={cn(avatarVariants({ size }), className)} role="img" aria-label={alt || "avatar"}>
      {src ? (
        <img src={src} alt={alt || ""} className="w-full h-full object-cover" />
      ) : (
        <span aria-hidden="true">{fallback || "?"}</span>
      )}
    </span>
  );
}
```

- [ ] **7.14** Create `packages/ui/react/src/atomic/Avatar/index.ts`:

```ts
export { Avatar } from "./Avatar";
export type { AvatarProps } from "./Avatar";
```

- [ ] **7.15** Create `packages/ui/react/src/molecular/Card/Card.tsx`:

```tsx
import { type HTMLAttributes } from "react";

import { cn } from "@prepforall/shared/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--color-neutral-200)] bg-[var(--color-surface)] overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-6 py-4 border-t border-[var(--color-neutral-200)]", className)}
      {...props}
    />
  );
}
```

- [ ] **7.16** Create `packages/ui/react/src/molecular/Card/index.ts`:

```ts
export { Card, CardHeader, CardBody, CardFooter } from "./Card";
export type { CardProps } from "./Card";
```

- [ ] **7.17** Create `packages/ui/react/src/molecular/Modal/Modal.tsx`:

```tsx
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";
import { IconClose } from "@prepforall/icons";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          "bg-[var(--color-surface)] rounded-xl shadow-xl max-w-[500px] w-[90%] max-h-[85vh] overflow-y-auto p-6",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]"
              aria-label="Close"
            >
              <IconClose size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
```

- [ ] **7.18** Create `packages/ui/react/src/molecular/Modal/index.ts`:

```ts
export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";
```

- [ ] **7.19** Create `packages/ui/react/src/molecular/Tabs/Tabs.tsx`:

```tsx
import { useState, createContext, useContext, type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs compound components must be used within <Tabs>");
  return ctx;
}

export interface TabsProps {
  defaultTab: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultTab, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex border-b border-[var(--color-neutral-200)]", className)} role="tablist">
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 border-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] transition-colors",
        isActive && "text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) return null;
  return (
    <div role="tabpanel" className={cn("py-4", className)}>
      {children}
    </div>
  );
}
```

- [ ] **7.20** Create `packages/ui/react/src/molecular/Tabs/index.ts`:

```ts
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
export type { TabsProps } from "./Tabs";
```

- [ ] **7.21** Create `packages/ui/react/src/molecular/Accordion/Accordion.tsx`:

```tsx
import { useState, type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";
import { IconChevronDown } from "@prepforall/icons";

export interface AccordionItemData {
  id: string;
  title: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItemData[];
  /** Allow multiple items to be open at once */
  multiple?: boolean;
  className?: string;
}

export function Accordion({ items, multiple = false, className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(multiple ? prev : []);
      if (prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn("border border-[var(--color-neutral-200)] rounded-lg overflow-hidden", className)}>
      {items.map((item, i) => {
        const isOpen = openIds.has(item.id);
        return (
          <div key={item.id} className={cn(i < items.length - 1 && "border-b border-[var(--color-neutral-200)]")}>
            <button
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium text-left hover:bg-[var(--color-neutral-50)] transition-colors"
              aria-expanded={isOpen}
            >
              {item.title}
              <IconChevronDown
                size={16}
                className={cn("transition-transform", isOpen && "rotate-180")}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-4 text-sm text-[var(--color-neutral-600)]">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **7.22** Create `packages/ui/react/src/molecular/Accordion/index.ts`:

```ts
export { Accordion } from "./Accordion";
export type { AccordionProps, AccordionItemData } from "./Accordion";
```

- [ ] **7.23** Create `packages/ui/react/src/molecular/Toast/Toast.tsx`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";
import { IconClose } from "@prepforall/icons";

const toastVariants = cva(
  "flex items-start gap-2 p-4 rounded-lg shadow-lg font-sans text-sm min-w-[300px] max-w-[420px]",
  {
    variants: {
      variant: {
        success: "bg-[var(--color-success-light)] border-l-4 border-l-[var(--color-success)]",
        error: "bg-[var(--color-error-light)] border-l-4 border-l-[var(--color-error)]",
        warning: "bg-[var(--color-warning-light)] border-l-4 border-l-[var(--color-warning)]",
        info: "bg-[var(--color-info-light)] border-l-4 border-l-[var(--color-info)]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

export interface ToastProps extends VariantProps<typeof toastVariants> {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Toast({ variant, children, onClose, className }: ToastProps) {
  return (
    <div className={cn(toastVariants({ variant }), className)} role="alert">
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="p-0.5 flex-shrink-0" aria-label="Dismiss">
          <IconClose size={16} />
        </button>
      )}
    </div>
  );
}
```

- [ ] **7.24** Create `packages/ui/react/src/molecular/Toast/index.ts`:

```ts
export { Toast } from "./Toast";
export type { ToastProps } from "./Toast";
```

- [ ] **7.25** Create `packages/ui/react/src/organisms/DataTable/DataTable.tsx`:

```tsx
import { type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyMessage = "No data available",
  className,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto border border-[var(--color-neutral-200)] rounded-lg", className)}>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[var(--color-neutral-50)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left font-medium text-[var(--color-neutral-600)] border-b border-[var(--color-neutral-200)] whitespace-nowrap",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[var(--color-neutral-500)]">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[var(--color-neutral-500)]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  "border-b border-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-50)]",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.render ? col.render(row, i) : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **7.26** Create `packages/ui/react/src/organisms/DataTable/index.ts`:

```ts
export { DataTable } from "./DataTable";
export type { DataTableProps, Column } from "./DataTable";
```

- [ ] **7.27** Create `packages/ui/react/src/organisms/Sidebar/Sidebar.tsx`:

```tsx
import { type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";

export interface SidebarItem {
  id: string;
  icon?: ReactNode;
  label: string;
  href: string;
}

export interface SidebarProps {
  items: SidebarItem[];
  activeId?: string;
  expanded?: boolean;
  className?: string;
  onItemClick?: (item: SidebarItem) => void;
  renderLink?: (props: { item: SidebarItem; children: ReactNode; className: string }) => ReactNode;
}

export function Sidebar({
  items,
  activeId,
  expanded = false,
  className,
  onItemClick,
  renderLink,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[var(--color-neutral-200)] bg-[var(--color-surface)] py-4 flex-shrink-0",
        expanded ? "w-60" : "w-14",
        className
      )}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        const itemClassName = cn(
          "flex items-center gap-2 px-4 py-2 rounded-md mx-1 transition-colors",
          isActive
            ? "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
            : "text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)]"
        );

        const content = (
          <>
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            {expanded && <span className="text-sm">{item.label}</span>}
          </>
        );

        if (renderLink) {
          return (
            <div key={item.id}>
              {renderLink({ item, children: content, className: itemClassName })}
            </div>
          );
        }

        return (
          <button
            key={item.id}
            className={itemClassName}
            onClick={() => onItemClick?.(item)}
            title={!expanded ? item.label : undefined}
          >
            {content}
          </button>
        );
      })}
    </aside>
  );
}
```

- [ ] **7.28** Create `packages/ui/react/src/organisms/Sidebar/index.ts`:

```ts
export { Sidebar } from "./Sidebar";
export type { SidebarProps, SidebarItem } from "./Sidebar";
```

- [ ] **7.29** Create `packages/ui/react/src/organisms/Navbar/Navbar.tsx`:

```tsx
import { type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";

export interface NavbarProps {
  brand: ReactNode;
  navigation?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Navbar({ brand, navigation, actions, className }: NavbarProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between h-14 px-6 border-b border-[var(--color-neutral-200)] bg-[var(--color-surface)]",
        className
      )}
    >
      <div className="flex-shrink-0">{brand}</div>
      {navigation && <nav className="flex items-center gap-6">{navigation}</nav>}
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
```

- [ ] **7.30** Create `packages/ui/react/src/organisms/Navbar/index.ts`:

```ts
export { Navbar } from "./Navbar";
export type { NavbarProps } from "./Navbar";
```

- [ ] **7.31** Create `packages/ui/react/src/index.ts` -- barrel export:

```ts
// Atomic
export { Button, buttonVariants } from "./atomic/Button";
export type { ButtonProps } from "./atomic/Button";

export { Input } from "./atomic/Input";
export type { InputProps } from "./atomic/Input";

export { Badge, badgeVariants } from "./atomic/Badge";
export type { BadgeProps } from "./atomic/Badge";

export { Avatar } from "./atomic/Avatar";
export type { AvatarProps } from "./atomic/Avatar";

// Molecular
export { Card, CardHeader, CardBody, CardFooter } from "./molecular/Card";
export type { CardProps } from "./molecular/Card";

export { Modal } from "./molecular/Modal";
export type { ModalProps } from "./molecular/Modal";

export { Tabs, TabsList, TabsTrigger, TabsContent } from "./molecular/Tabs";
export type { TabsProps } from "./molecular/Tabs";

export { Accordion } from "./molecular/Accordion";
export type { AccordionProps, AccordionItemData } from "./molecular/Accordion";

export { Toast } from "./molecular/Toast";
export type { ToastProps } from "./molecular/Toast";

// Organisms
export { DataTable } from "./organisms/DataTable";
export type { DataTableProps, Column } from "./organisms/DataTable";

export { Sidebar } from "./organisms/Sidebar";
export type { SidebarProps, SidebarItem } from "./organisms/Sidebar";

export { Navbar } from "./organisms/Navbar";
export type { NavbarProps } from "./organisms/Navbar";
```

- [ ] **7.32** Run tests:

```bash
yarn workspace @prepforall/react test
```

Expected: Button tests (5) and Input tests (3) pass. Total 8 tests passing.

- [ ] **7.33** Run type-check:

```bash
yarn workspace @prepforall/react type-check
```

Expected: No TypeScript errors.

**Commit point:** `feat: add @prepforall/react with atomic, molecular, and organism components`

---

## Task 8: Storybook Setup

**Files to create:**
- `storybook/package.json`
- `storybook/.storybook/main.ts`
- `storybook/.storybook/preview.ts`
- `storybook/.storybook/preview-head.html`
- `storybook/stories/atomic/Button.stories.tsx`
- `storybook/stories/atomic/Input.stories.tsx`
- `storybook/stories/atomic/Badge.stories.tsx`
- `storybook/stories/atomic/Avatar.stories.tsx`
- `storybook/stories/molecular/Card.stories.tsx`
- `storybook/stories/molecular/Modal.stories.tsx`
- `storybook/stories/molecular/Tabs.stories.tsx`
- `storybook/stories/tokens/Colors.stories.tsx`
- `storybook/tsconfig.json`

### Steps

- [ ] **8.1** Create `storybook/package.json`:

```json
{
  "name": "@prepforall/storybook",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "@prepforall/tokens": "workspace:*",
    "@prepforall/css": "workspace:*",
    "@prepforall/icons": "workspace:*",
    "@prepforall/react": "workspace:*",
    "@prepforall/shared": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@prepforall/typescript-config": "workspace:*",
    "@storybook/addon-essentials": "^8.6.0",
    "@storybook/addon-a11y": "^8.6.0",
    "@storybook/react": "^8.6.0",
    "@storybook/react-vite": "^8.6.0",
    "storybook": "^8.6.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **8.2** Create `storybook/.storybook/main.ts`:

```ts
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
```

- [ ] **8.3** Create `storybook/.storybook/preview.ts`:

```ts
import type { Preview } from "@storybook/react";
import "@prepforall/tokens";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#0f172a" },
      ],
    },
  },
};

export default preview;
```

- [ ] **8.4** Create `storybook/.storybook/preview-head.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

- [ ] **8.5** Create `storybook/tsconfig.json`:

```json
{
  "extends": "@prepforall/typescript-config/react-library.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["stories/**/*.ts", "stories/**/*.tsx", ".storybook/**/*.ts"]
}
```

- [ ] **8.6** Create `storybook/stories/atomic/Button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@prepforall/react";

const meta: Meta<typeof Button> = {
  title: "Atomic/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "destructive", "outline"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
    },
    isLoading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: "Primary Button", variant: "primary" },
};

export const Secondary: Story = {
  args: { children: "Secondary", variant: "secondary" },
};

export const Ghost: Story = {
  args: { children: "Ghost", variant: "ghost" },
};

export const Destructive: Story = {
  args: { children: "Delete", variant: "destructive" },
};

export const Loading: Story = {
  args: { children: "Saving...", isLoading: true },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

- [ ] **8.7** Create `storybook/stories/atomic/Input.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@prepforall/react";

const meta: Meta<typeof Input> = {
  title: "Atomic/Input",
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "Enter text..." },
};

export const WithLabel: Story = {
  args: { label: "Email", placeholder: "you@example.com" },
};

export const WithError: Story = {
  args: { label: "Email", error: "This field is required", value: "" },
};

export const WithHelper: Story = {
  args: { label: "Username", helperText: "Must be at least 3 characters" },
};
```

- [ ] **8.8** Create `storybook/stories/atomic/Badge.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@prepforall/react";

const meta: Meta<typeof Badge> = {
  title: "Atomic/Badge",
  component: Badge,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "error", "warning", "info"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { children: "Default" } };
export const Success: Story = { args: { children: "Accepted", variant: "success" } };
export const Error: Story = { args: { children: "Wrong Answer", variant: "error" } };
export const Warning: Story = { args: { children: "TLE", variant: "warning" } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px" }}>
      <Badge>Default</Badge>
      <Badge variant="success">AC</Badge>
      <Badge variant="error">WA</Badge>
      <Badge variant="warning">TLE</Badge>
      <Badge variant="info">Pending</Badge>
    </div>
  ),
};
```

- [ ] **8.9** Create `storybook/stories/atomic/Avatar.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "@prepforall/react";

const meta: Meta<typeof Avatar> = {
  title: "Atomic/Avatar",
  component: Avatar,
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: { src: "https://avatars.githubusercontent.com/u/1?v=4", alt: "User", size: "md" },
};

export const WithFallback: Story = {
  args: { fallback: "SS", size: "md" },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <Avatar fallback="S" size="sm" />
      <Avatar fallback="M" size="md" />
      <Avatar fallback="L" size="lg" />
    </div>
  ),
};
```

- [ ] **8.10** Create `storybook/stories/molecular/Card.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardBody, CardFooter, Button } from "@prepforall/react";

const meta: Meta<typeof Card> = {
  title: "Molecular/Card",
  component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card style={{ maxWidth: "400px" }}>
      <CardHeader>
        <h3 style={{ fontWeight: 600 }}>Two Sum</h3>
      </CardHeader>
      <CardBody>
        <p style={{ fontSize: "14px", color: "var(--color-neutral-600)" }}>
          Given an array of integers, return indices of the two numbers such that they add up to a specific target.
        </p>
      </CardBody>
      <CardFooter>
        <Button size="sm">Solve</Button>
      </CardFooter>
    </Card>
  ),
};
```

- [ ] **8.11** Create `storybook/stories/molecular/Modal.stories.tsx` and `storybook/stories/molecular/Tabs.stories.tsx` following the same pattern as above.

- [ ] **8.12** Create `storybook/stories/tokens/Colors.stories.tsx` -- a documentation story that renders all token colors:

```tsx
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Tokens/Colors",
};

export default meta;

const colorTokens = [
  { name: "--color-brand-primary", label: "Brand Primary" },
  { name: "--color-brand-accent", label: "Brand Accent" },
  { name: "--color-neutral-50", label: "Neutral 50" },
  { name: "--color-neutral-100", label: "Neutral 100" },
  { name: "--color-neutral-500", label: "Neutral 500" },
  { name: "--color-neutral-900", label: "Neutral 900" },
  { name: "--color-success", label: "Success" },
  { name: "--color-error", label: "Error" },
  { name: "--color-warning", label: "Warning" },
  { name: "--color-info", label: "Info" },
];

export const AllColors: StoryObj = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
      {colorTokens.map(({ name, label }) => (
        <div key={name} style={{ textAlign: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "8px",
              backgroundColor: `var(${name})`,
              border: "1px solid var(--color-neutral-200)",
              margin: "0 auto 8px",
            }}
          />
          <div style={{ fontSize: "12px", fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: "11px", color: "var(--color-neutral-500)" }}>{name}</div>
        </div>
      ))}
    </div>
  ),
};
```

- [ ] **8.13** Run Storybook:

```bash
yarn workspace @prepforall/storybook storybook
```

Expected: Storybook opens on `http://localhost:6006` showing all stories organized by Tokens, Atomic, Molecular categories.

**Commit point:** `feat: add Storybook with stories for all design system components`

---

## Task 9: Turborepo Pipeline Verification

**Files to modify:**
- `turbo.json` (if adjustments needed)

### Steps

- [ ] **9.1** Run the full CSS build pipeline:

```bash
yarn turbo run build:css
```

Expected: `@prepforall/tokens` runs its no-op build, then `@prepforall/css` processes all CSS modules. Both tasks succeed.

- [ ] **9.2** Run the icons build pipeline:

```bash
yarn turbo run build:icons
```

Expected: `@prepforall/icons` transforms all SVGs to React components. Output shows built count.

- [ ] **9.3** Run the React build pipeline (depends on CSS + icons):

```bash
yarn turbo run build:react
```

Expected: `build:css` runs first, then `build:icons`, then `@prepforall/react` compiles TypeScript. All succeed. Turborepo shows the dependency graph.

- [ ] **9.4** Run the full build including `apps/web`:

```bash
yarn turbo run build
```

Expected: All packages build in dependency order. `@prepforall/web` (Next.js) builds last. Exit code 0.

- [ ] **9.5** Run all tests across the monorepo:

```bash
yarn turbo run test
```

Expected: `@prepforall/shared` tests (10 passing) and `@prepforall/react` tests (8 passing) both succeed.

- [ ] **9.6** Run type-check across all workspaces:

```bash
yarn turbo run type-check
```

Expected: No TypeScript errors in any workspace.

- [ ] **9.7** Verify Turborepo caching works. Run `yarn turbo run build` a second time:

```bash
yarn turbo run build
```

Expected: All tasks show `cache hit, replaying logs`. Execution time near-zero.

- [ ] **9.8** Update the root `Makefile` to use Turbo commands:

Add targets:
```makefile
# ── Turbo (Monorepo) ──────────────────────────────────────────────────────
turbo-build:
	yarn turbo run build

turbo-test:
	yarn turbo run test

turbo-lint:
	yarn turbo run lint

turbo-type-check:
	yarn turbo run type-check

storybook:
	yarn workspace @prepforall/storybook storybook
```

- [ ] **9.9** Update `apps/web/package.json` to depend on shared packages:

```json
{
  "dependencies": {
    "@prepforall/tokens": "workspace:*",
    "@prepforall/react": "workspace:*",
    "@prepforall/shared": "workspace:*"
  }
}
```

- [ ] **9.10** Update `apps/web/tailwind.config.ts` to extend the shared config:

```ts
import type { Config } from "tailwindcss";
import sharedConfig from "@prepforall/tailwind-config";

const config: Config = {
  presets: [sharedConfig as Config],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/react/src/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.{ts,tsx}",
  ],
  plugins: [require("@tailwindcss/typography")],
};

export default config;
```

- [ ] **9.11** Update `apps/web/postcss.config.js` to use shared config:

```js
module.exports = require("@prepforall/postcss-config");
```

- [ ] **9.12** Update `apps/web/app/globals.css` to import tokens instead of inline definitions:

```css
@import "@prepforall/tokens";
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **9.13** Final full build and test:

```bash
yarn turbo run build test type-check
```

Expected: All tasks pass. Zero errors.

**Commit point:** `feat: verify turborepo pipeline, integrate shared configs into apps/web`

---

## Summary of All Packages

| Package | Path | Version | Dependencies |
|---|---|---|---|
| `@prepforall/typescript-config` | `packages/config/typescript` | 0.0.0 | None |
| `@prepforall/eslint-config` | `packages/config/eslint` | 0.0.0 | ESLint plugins |
| `@prepforall/postcss-config` | `packages/config/postcss` | 0.0.0 | PostCSS plugins |
| `@prepforall/tailwind-config` | `packages/config/tailwind` | 0.0.0 | Tailwind CSS |
| `@prepforall/shared` | `packages/shared` | 0.0.1 | clsx, tailwind-merge |
| `@prepforall/tokens` | `packages/ui/tokens` | 0.0.1 | None (raw CSS) |
| `@prepforall/css` | `packages/ui/css` | 0.0.1 | @prepforall/tokens |
| `@prepforall/icons` | `packages/ui/icons` | 0.0.1 | SVGR, esbuild |
| `@prepforall/react` | `packages/ui/react` | 0.0.1 | tokens, icons, shared, CVA |
| `@prepforall/storybook` | `storybook` | 0.0.1 | All UI packages |

## Build Order (Turborepo resolves this automatically)

```
1. @prepforall/tokens (build:css) — raw CSS, no-op
2. @prepforall/css (build:css) — PostCSS pipeline
3. @prepforall/icons (build:icons) — SVGR pipeline
4. @prepforall/shared (no build — source TS consumed directly)
5. @prepforall/react (build:react) — TypeScript compilation
6. @prepforall/web (build) — Next.js build
```

## Commit History (9 commits total)

1. `feat: initialize Turborepo monorepo with Yarn workspaces`
2. `feat: add shared config packages (typescript, eslint, postcss, tailwind)`
3. `feat: add @prepforall/shared package with types and utils`
4. `feat: add @prepforall/tokens with colors, spacing, typography, radius, shadows`
5. `feat: add @prepforall/css with PostCSS pipeline and component CSS modules`
6. `feat: add @prepforall/icons with SVGR pipeline (13 starter icons)`
7. `feat: add @prepforall/react with atomic, molecular, and organism components`
8. `feat: add Storybook with stories for all design system components`
9. `feat: verify turborepo pipeline, integrate shared configs into apps/web`

---

### Critical Files for Implementation

These are the files most critical for understanding and implementing this plan:

- `/Users/sahilsharma/education/prepforall/docs/superpowers/specs/01-monorepo-and-tooling.md` -- the source spec defining directory structure, turborepo pipeline, and component ownership
- `/Users/sahilsharma/education/prepforall/docs/superpowers/specs/02-design-system.md` -- the source spec defining the layered token/CSS/icons/React architecture
- `/Users/sahilsharma/education/prepforall/apps/web/package.json` -- existing app that must remain functional throughout the migration; its dependencies and scripts need careful updating
- `/Users/sahilsharma/education/prepforall/apps/web/app/globals.css` -- current inline design tokens that will be replaced by `@prepforall/tokens`
- `/Users/sahilsharma/education/prepforall/apps/web/tailwind.config.ts` -- current Tailwind config that will be refactored to extend the shared preset
