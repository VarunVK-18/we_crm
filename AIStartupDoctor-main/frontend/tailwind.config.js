/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        'heading': ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        'manrope': ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontWeight: {
        'body': '400',
        'subheading': '500',
        'subheading-bold': '600',
        'heading': '600',
        'heading-bold': '700',
        'button': '500',
        'label': '500',
      }
    },
  },
  plugins: [],
};
