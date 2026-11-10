import { NextResponse } from 'next/server';
import { lerFormularioChamado } from '@/lib/formChamado';
import { handleError } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { abrir, listar } from '@/services/chamadosService';

// GET /api/chamados — morador vê os próprios; portaria e síndico veem todos do condomínio
export async function GET() {
  try {
    return NextResponse.json(await listar(await requireSession()));
  } catch (err) {
    return handleError(err, 'chamados');
  }
}

// POST /api/chamados (multipart) — titulo, descricao, categoriaId, urgencia, anexo?
export async function POST(request) {
  try {
    const session = await requireSession();
    const { dados, arquivo } = await lerFormularioChamado(request);
    return NextResponse.json({ chamado: await abrir(session, dados, arquivo) }, { status: 201 });
  } catch (err) {
    return handleError(err, 'chamados');
  }
}
