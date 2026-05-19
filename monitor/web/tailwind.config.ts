import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: '#1e293b',
        background: '#020617',
        foreground: '#e2e8f0',
        muted: '#0f172a',
        card: '#111827',
        accent: '#1d4ed8',
      },
    },
  },
  plugins: [],
} satisfies Config
