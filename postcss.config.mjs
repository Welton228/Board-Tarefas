/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // 👈 O segredo está aqui
    autoprefixer: {},
  },
};

export default config;