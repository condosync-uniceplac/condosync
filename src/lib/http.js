/**
 * Funções de apoio às rotas da API: ler o corpo JSON, validar dados, descobrir o IP
 * e transformar erros em respostas padronizadas.
 */

import { NextResponse } from 'next/server';
import { AppError } from './errors';

/** Lê o corpo JSON da requisição; corpo inválido vira 400. */
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new AppError(400, 'Corpo da requisição deve ser um JSON válido.');
  }
}

/** Valida `data` com um schema zod; falha vira 422 com os campos inválidos. */
export function parseWith(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields = {};
    // Monta { campo: mensagem }, guardando só a primeira mensagem de cada campo.
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      fields[key] ??= issue.message;
    }
    throw new AppError(422, 'Dados inválidos.', fields);
  }
  return result.data;
}

/** IP do cliente (atrás de proxy/Docker vem em x-forwarded-for). */
export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip');
  return ip || null;
}

/** Converte qualquer erro em resposta JSON, sem vazar detalhes internos. */
export function handleError(err, context = 'api') {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: err.message, ...(err.details ? { fields: err.details } : {}) },
      { status: err.status },
    );
  }
  // Loga só a mensagem: nunca o corpo da requisição (pode conter senha)
  console.error(`[${context}] erro inesperado:`, err?.message);
  return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 });
}
