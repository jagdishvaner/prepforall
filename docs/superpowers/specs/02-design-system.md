# 02 — Design System (packages/ui)

> Naos-inspired layered atomic design with separate CSS and React build pipelines.

**Related specs:** [01-monorepo-and-tooling](01-monorepo-and-tooling.md), [03-marketing-site](03-marketing-site.md), [04-platform-app](04-platform-app.md)
**References:** Naos Design System (DTSL), DTSL marketing-component-library (code reference only — private GitHub packages)

---

## Structure

```
packages/ui/
├── tokens/                         # @prepforall/tokens
│   └── src/                        # CSS custom properties: colors, spacing, typography
│
├── css/                            # @prepforall/css
│   ├── src/                        # Per-component CSS modules
│   ├── postcss.config.js           # Shared PostCSS pipeline
│   └── package.json
│
├── icons/                          # @prepforall/icons
│   └── src/                        # SVG → React components (SVGR)
│
└── react/                          # @prepforall/react
    └── src/
        ├── atomic/                 # Button, Input, Badge, Avatar, Checkbox, etc.
        ├── molecular/              # Card, Form, Modal, Tabs, Dropdown, Toast, etc.
        └── organisms/              # DataTable, CodeEditor, Sidebar, Navbar
```

## Key Patterns

- **Separate CSS and React builds** — `turbo run build:css` then `turbo run build:react`
- **Design tokens** — centralized colors, spacing, typography as CSS variables
- **Atomic design** — atomic → molecular → organisms
- **SVGR icons** — SVGs compiled to React components
- **Storybook** — component documentation, shared across both apps
- **Tailwind CSS** — used alongside design tokens for rapid development

## Typography

| Usage | Font | Weight |
|---|---|---|
| Headings | DM Sans | Bold (700) |
| Body text | Inter | Regular (400) |
| Code snippets | JetBrains Mono | Regular (400) |

## Design Tokens

```css
/* packages/ui/tokens/src/colors.css */
:root {
  --color-brand-primary: ...;
  --color-brand-accent: ...;
  --color-neutral-50: ...;
  --color-neutral-900: ...;
  --color-success: ...;
  --color-error: ...;
  --color-warning: ...;
}

/* packages/ui/tokens/src/spacing.css */
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

## Build Pipeline

```
tokens (CSS variables)
  ↓
css (PostCSS → per-component CSS modules)
  ↓
icons (SVG → React via SVGR)
  ↓
react (React components importing CSS modules + icons)
```

## What Goes in packages/ui vs App Components

`packages/ui` contains **reusable, presentational primitives** shared across both apps:
- Button, Input, Select, Checkbox, Radio
- Card, Modal, Tabs, Accordion, Dropdown
- Toast, Tooltip, Badge, Avatar, Skeleton
- DataTable, Sidebar, Navbar

App-specific compositions that embed **business logic, API calls, or feature-specific state** stay in their respective `apps/*/components/` directories.

---

*Last updated: April 5, 2026*
