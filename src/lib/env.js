/**
 * Leitura e validação das variáveis de ambiente (endereço do banco, segredo do JWT etc.).
 */

import { z } from 'zod';

// Converte textos como 'true'/'1' em verdadeiro e o resto em falso.
const booleanString = z
  .enum(['true', 'false', '1', '0', ''])
  .optional()
  .transform((v) => v === 'true' || v === '1');

// Variáveis esperadas e as regras de cada uma (zod).
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL não definida'),
  DB_SSL: booleanString,
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

// Guarda o resultado para não validar de novo a cada chamada.
let cached;

/**
 * Lê e valida as variáveis de ambiente sob demanda (não na importação),
 * para que o `next build` funcione sem um .env presente.
 */
export function getEnv() {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Mostra apenas os nomes das variáveis inválidas, nunca os valores
    const campos = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Variáveis de ambiente inválidas:\n  - ${campos.join('\n  - ')}`);
  }
  cached = parsed.data;
  return cached;
}

// Indica se o sistema está rodando em produção.
export const isProduction = () => process.env.NODE_ENV === 'production';
