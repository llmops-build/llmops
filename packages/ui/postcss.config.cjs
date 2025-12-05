module.exports = {
  plugins: {
    '@stylexjs/postcss-plugin': {
      include: [
        './src/**/*.{js,jsx,ts,tsx}',
      ],
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
};