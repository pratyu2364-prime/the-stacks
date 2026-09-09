/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#efe6d2',
        ink: '#1a1410',
        lamp: '#ffb45c',
        oak: '#5a3f26',
        gloom: '#0a0705',
        dust: '#b6a68c',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
