/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        brand: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        palette: {
          lightblue: '#d3ebff',
          slate: '#632024',
          mist: '#8db4d2',
          cream: '#d5b893',
          taupe: '#25344f',
          terracotta: '#6f4d38',
        },
        surface: {
          DEFAULT: '#faf9f7',
          raised: '#ffffff',
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(37 52 79 / 0.06), 0 1px 2px -1px rgb(37 52 79 / 0.06)',
        'card-hover': '0 4px 14px -2px rgb(37 52 79 / 0.08), 0 6px 20px -4px rgb(37 52 79 / 0.06)',
        'dialog': '0 20px 50px -12px rgb(0 0 0 / 0.2), 0 0 0 1px rgb(37 52 79 / 0.06)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

