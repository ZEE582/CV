/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'grotesk': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'syne': ['Syne', 'system-ui', 'sans-serif'],
        'bitcount': ['"Bitcount Grid Single"', 'monospace'],
      },
      colors: {
        primary: '#4f46e5',
        secondary: '#9089fc',
        accent: '#ff80b5',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'fadeUp': 'fadeUp 0.8s ease-out both',
        'float': 'float 6s ease-in-out infinite',
        'marquee': 'marquee 25s linear infinite',
        'blink': 'blink 1s step-end infinite',
        'gridMove': 'gridMove 20s linear infinite',
        'orbFloat1': 'orbFloat1 8s ease-in-out infinite',
        'orbFloat2': 'orbFloat2 10s ease-in-out infinite',
        'orbFloat3': 'orbFloat3 12s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        gridMove: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '60px 60px' },
        },
        orbFloat1: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(30px, -30px)' },
        },
        orbFloat2: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-20px, 20px)' },
        },
        orbFloat3: {
          '0%, 100%': { transform: 'translate(-50%, -50%)' },
          '50%': { transform: 'translate(-50%, -60%)' },
        },
      },
    },
  },
  plugins: [],
}
