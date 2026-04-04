import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        card: '#12121A',
        hover: '#1A1A28',
        blue: '#2D6FFF',
        cyan: '#00E5FF',
        red: '#FF3D57',
        green: '#00E5B0',
        primary: '#F0F4FF',
        secondary: '#8892AA',
        border: '#1E2035',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '12px',
      },
      boxShadow: {
        card: '0 0 40px rgba(45, 111, 255, 0.08)',
        blue: '0 0 20px rgba(45, 111, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
export default config
