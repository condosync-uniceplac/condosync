/**
 * Rota da API: /api/reservas/:id
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, parseWith } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { cancelar } from '@/services/reservasService';

// O :id da URL precisa ser um número inteiro positivo.
const idSchema = z.coerce.number().int().positive();

// DELETE /api/reservas/:id — cancela a reserva (o registro fica com status CANCELADA)
export async function DELETE(_request, { params }) {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    const id = parseWith(idSchema, (await params).id);
    await cancelar(session, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'reservas/[id]');
  }
}
