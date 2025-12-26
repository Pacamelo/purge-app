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
        'forge-accent-secondary': 'var(--forge-accent-secondary)',
        'forge-border': 'var(--forge-border)',
        'forge-success': 'var(--forge-success)',
        'forge-warning': 'var(--forge-warning)',
        'forge-error': 'var(--forge-error)',
        // Redaction bar visual language
        'purge-bar': 'var(--purge-bar)',
        'purge-bar-light': 'var(--purge-bar-light)',
        'purge-cut': 'var(--purge-cut)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
