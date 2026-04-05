import type { Config } from 'tailwindcss';
import sharedConfig from '@prepforall/tailwind-config';

const config: Config = {
  presets: [sharedConfig],
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/platform-ui/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/react/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        card: 'hsl(var(--background))',
        ring: 'hsl(var(--primary))',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
