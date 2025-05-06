/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // Azure blue for cloud/data
          dark: '#1d4ed8',
          light: '#3b82f6',
        },
        secondary: {
          DEFAULT: '#10b981', // Green for data flow
          dark: '#059669',
          light: '#34d399',
        },
        accent: {
          DEFAULT: '#8b5cf6', // Purple for data transformation
          dark: '#7c3aed',
          light: '#a78bfa',
        },
        data: {
          DEFAULT: '#0ea5e9', // Sky blue for data and pipeline draw.io arrows
          dark: '#0284c7',
          light: '#38bdf8',
        },
        pipeline: {
          DEFAULT: '#f59e0b', // Amber for data pipelines
          dark: '#d97706',
          light: '#fbbf24',
        },
        dark: {
          DEFAULT: '#0f172a', // Dark blue-gray for background
          100: '#1e293b',
          200: '#334155', // for draw.io pipeline background
          300: '#475569',
          400: '#64748b',
          500: '#94a3b8',
          600: '#cbd5e1',
          700: '#e2e8f0',
          800: '#f1f5f9',
          900: '#f8fafc',
        },
        'data-light': '#7dd3fc',
        'pipeline-light': '#38bdf8',
      },
      backgroundImage: {
        'data-pattern': "url('/images/data-pattern.svg')",
        'circuit-pattern': "url('/images/circuit-pattern.svg')",
      },
      animation: {
        'data-flow': 'dataFlow 3s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 10s ease-in-out infinite',
        'pipeline': 'pipeline 2s linear infinite',
        'particle': 'particle 3s linear infinite',
        pipeline: 'pipeline 3s linear infinite',
      },
      keyframes: {
        dataFlow: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        pipeline: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        particle: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0' },
          '50%': { transform: 'translateY(-50px) scale(1.5)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) scale(0)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
} 