import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // PURGE brand colors (forge-compatible naming)
        'forge-bg-primary': 'var(--forge-bg-primary)',
        'forge-bg-secondary': 'var(--forge-bg-secondary)',
        'forge-bg-tertiary': 'var(--forge-bg-tertiary)',
        'forge-text-primary': 'var(--forge-text-primary)',
        'forge-text-secondary': 'var(--forge-text-secondary)',
        'forge-text-dim': 'var(--forge-text-dim)',
        'forge-accent': 'var(--forge-accent)',
        'forge-border': 'var(--forge-border)',
        'forge-success': 'var(--forge-success)',
        'forge-warning': 'var(--forge-warning)',
        'forge-error': 'var(--forge-error)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
