/**
 * Rota da API: /api/avisos/:id
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lerFormularioAviso } from '@/lib/formAviso';
import { handleError, parseWith } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { editar, remover } from '@/services/avisosService';

// O :id da URL precisa ser um número inteiro positivo.
const idSchema = z.coerce.number().int().positive();

// PUT /api/avisos/:id (multipart) — síndico edita; anexo novo substitui, removerAnexo=true remove
export async function PUT(request, { params }) {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    const id = parseWith(idSchema, (await params).id);
    const { dados, arquivo, removerAnexo } = await lerFormularioAviso(request);
    await editar(session, id, dados, arquivo, { removerAnexo });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'avisos/[id]');
  }
}

// DELETE /api/avisos/:id — síndico remove o aviso (com anexos e leituras)
export async function DELETE(_request, { params }) {
  try {
    const session = await requireSession();
    await remover(session, parseWith(idSchema, (await params).id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err, 'avisos/[id]');
  }
}
