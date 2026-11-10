/**
 * Configuração do Next.js: modo de build e cabeçalhos de segurança HTTP enviados em todas as respostas.
 */

/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

// Cabeçalhos de segurança: bloqueiam o site dentro de iframes (clickjacking), impedem o navegador de
// adivinhar o tipo de arquivo, limitam o Referer e desligam câmera/microfone/localização.
// Em produção, o HSTS obriga o uso de HTTPS.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
    : []),
];

const nextConfig = {
  // standalone: gera um build enxuto, pronto para rodar em container; sem o cabeçalho "X-Powered-By".
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  // pg usa módulos nativos opcionais; não deve ser empacotado pelo bundler
  serverExternalPackages: ['pg'],
  // Aplica os cabeçalhos acima em todas as rotas.
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
