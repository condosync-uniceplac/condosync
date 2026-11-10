/**
 * Rota da API: /api/avisos/:id/anexos/:anexoId
 * No Next.js, cada função exportada (GET, POST, PUT, PATCH, DELETE) atende um método HTTP.
 * Fluxo: confere a sessão -> valida os dados -> chama o service -> responde em JSON.
 */

import { z } from 'zod';
import { handleError, parseWith } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { baixarAnexo } from '@/services/avisosService';

// O :id da URL precisa ser um número inteiro positivo.
const idSchema = z.coerce.number().int().positive();

// GET /api/avisos/:id/anexos/:anexoId — download do anexo (bug #19)
export async function GET(_request, { params }) {
  try {
    // Exige login válido (e o perfil, quando indicado); senão responde 401/403.
    const session = await requireSession();
    const p = await params;
    const anexo = await baixarAnexo(
      session,
      parseWith(idSchema, p.id),
      parseWith(idSchema, p.anexoId),
    );
    const nome = encodeURIComponent(anexo.nome_arquivo);
    // Devolve os bytes do arquivo como download, com o tipo e o nome corretos
    // e sem cache (o arquivo é privado).
    return new Response(anexo.conteudo, {
      headers: {
        'Content-Type': anexo.mime_type,
        'Content-Length': String(anexo.tamanho_bytes),
        'Content-Disposition': `attachment; filename="anexo"; filename*=UTF-8''${nome}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    // Qualquer erro vira uma resposta JSON padronizada (ver handleError em src/lib/http.js).
    return handleError(err, 'avisos/[id]/anexos');
  }
}
