import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3faf7',
          100: '#dcf3e8',
          500: '#159a68',
          600: '#0f7a52',
          700: '#0d6343',
        },
      },
      boxShadow: {
        panel: '0 10px 30px -15px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config;
