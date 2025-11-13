/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          primary: '#ff00ff',
          secondary: '#a020f0',
          accent: '#00ffff',
          success: '#00ff00',
          danger: '#ff4444',
          warning: '#ffaa00',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'cosmic-pulse': 'cosmicPulse 6s ease-in-out infinite',
        'neon-glow': 'neonGlow 2s ease-in-out infinite',
      },
      keyframes: {
        cosmicPulse: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        neonGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 10px #ff00ff, 0 0 20px #a020f0' 
          },
          '50%': { 
            boxShadow: '0 0 20px #ff00ff, 0 0 40px #a020f0' 
          },
        },
      },
    },
  },
  plugins: [],
}
