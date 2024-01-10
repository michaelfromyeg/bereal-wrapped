/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        'light-blue': '#0076a0',
        'dark-blue': '#003e54',
        'link': '#69b8d7',
        'link-dark': '#5596b0',
      },
      backgroundImage: {
        'subtle-radial': 'radial-gradient(circle at center, #003e54 10%, #0f0f0f 60%)'
      },
      gradientColorStops: theme => ({
        'dark': '#003e54',
        'black': '#0f0f0f',
      }),
    },
  },
  plugins: [],
}

