import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: {'max': '480px'},
      sm: {'max': '412px'},
    },
    extend: {
      padding: {
        '18': '18px', // Adiciona o valor personalizado
      },
      height: {
        '76': '76px', // Define a altura personalizada
      },
      maxWidth: {
        '480px': '480px', // Define o max-width personalizado
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'], // define a fonte personalizada
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
} satisfies Config;
