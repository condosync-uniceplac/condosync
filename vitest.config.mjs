/**
 * Configuração do Vitest (testes automatizados): o atalho '@' aponta para src/,
 * e os testes são os arquivos tests/*.test.js, rodando em ambiente Node.
 */

import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    include: ['tests/**/*.test.{js,jsx}'],
    environment: 'node',
  },
});
