import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 
  // Configuração de imagens, caso queira otimizar imagens de domínios específicos
  images: {
    // Defina aqui os domínios permitidos para carregamento de imagens
    domains: ['example.com'], // Exemplo de domínio, substitua pelo seu domínio real
  },

  // Configuração para redirecionamentos (opcional)
  async redirects() {
    return [
      {
        source: '/old-url',  // URL antiga
        destination: '/new-url',  // Nova URL
        permanent: true,  // Se for redirecionamento permanente
      },
    ];
  },

  // Configuração do Webpack (opcional)
  webpack(config) {
    // Exemplo de como adicionar regras personalizadas no Webpack
    config.module.rules.push({
      test: /\.md$/,  // Regra para arquivos Markdown
      use: 'raw-loader',  // Usa o loader raw-loader para lidar com arquivos Markdown
    });
    return config;  // Retorna a configuração modificada
  },

  // Configurações de variáveis de ambiente
  env: {
    // Variáveis de ambiente personalizadas que podem ser usadas no frontend
    CUSTOM_API_URL: process.env.CUSTOM_API_URL,  // Exemplo de variável de ambiente
  },

  // Configuração de TypeScript, caso seja necessário ignorar erros durante a construção
  typescript: {
    // Ignorar erros de construção do TypeScript (não recomendado em produção)
    ignoreBuildErrors: true,  
  },

  // Outras configurações possíveis para otimização do Next.js podem ser adicionadas aqui
  // Por exemplo, para desabilitar a análise de pacotes (útil para produção)
  // productionBrowserSourceMaps: false,
};

export default nextConfig;
