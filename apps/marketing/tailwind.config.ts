import type { Config } from "tailwindcss";
import sharedConfig from "@prepforall/tailwind-config";

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
        "brand-dark": "#042729",
        "surface-warm": "#fcfcfa",
        "surface-cream": "#f8f5ee",
        "surface-salmon": "#fcded2",
        "text-primary": "#1f1f1f",
        "text-secondary": "#516f90",
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
