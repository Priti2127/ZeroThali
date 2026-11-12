module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#14342B',
        'primary-dark': '#0d2419',
        midGreen: '#1F5B45',
        saffron: '#F2A413',
        brick: '#B5543A',
        light: '#EEF3EF',
        lightGrey: '#EEF3EF',
        edible: '#28A745',
        claimed: '#6C757D',
        unfit: '#DC3545',
        dark: {
          bg: '#0f1f1a',
          surface: '#1a2f27',
        },
      },
      borderRadius: {
        card: '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
