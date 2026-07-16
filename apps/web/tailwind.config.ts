import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#287d73',
          dark: '#216c63',
          light: '#4fa294',
          mint: '#edf7f3',
          sand: '#f8efd2',
        },
        ink: '#17211f',
        muted: '#70807b',
        line: '#e4ebe8',
      },
      fontFamily: {
        arabic: ['"Noto Sans Arabic"', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        xl2: '18px',
      },
    },
  },
  plugins: [],
};

export default config;
