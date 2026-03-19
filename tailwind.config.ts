import type { Config } from "tailwindcss";

export default {
  
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // Adicionei estas para garantir que ele varra as pastas de UI que você usou
    "./createTaskUi/**/*.{js,ts,jsx,tsx,mdx}", 
  ],
  theme: {
    extend: {
      // ✅ MOVA os screens para dentro do extend se quiser manter os padrões,
      // ou use nomes diferentes para não bugar os plugins de CSS.
      screens: {
        'xs': {'max': '480px'},
        // 'sm' original é 640px. Mudar para 342px max pode quebrar bibliotecas de UI.
        'mobile-sm': {'max': '342px'}, 
      },
      padding: {
        '18': '18px',
      },
      height: {
        '76': '76px',
      },
      maxWidth: {
        '480': '480px', // Removido o 'px' do nome da chave para evitar erro de parse
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      zIndex: {
        '60': '60',
      },
    },
  },
  plugins: [],
} satisfies Config;

