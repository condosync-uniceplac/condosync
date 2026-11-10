import { z } from 'zod';
import { handleError, parseWith } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { baixarAnexo } from '@/services/chamadosService';

const idSchema = z.coerce.number().int().positive();

// GET /api/chamados/:id/anexos/:anexoId — foto do chamado (morador só baixa a dos próprios)
export async function GET(_request, { params }) {
  try {
    const session = await requireSession();
    const p = await params;
    const anexo = await baixarAnexo(
      session,
      parseWith(idSchema, p.id),
      parseWith(idSchema, p.anexoId),
    );
    const nome = encodeURIComponent(anexo.nome_arquivo);
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
    return handleError(err, 'chamados/[id]/anexos');
  }
}
