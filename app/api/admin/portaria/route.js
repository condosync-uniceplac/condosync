import { NextResponse } from 'next/server';
import { handleError, parseWith, readJson } from '@/lib/http';
import { requireSession } from '@/lib/session';
import { contaPortariaSchema } from '@/lib/validators';
import { GESTAO, criarPortaria, listarPortaria } from '@/services/moradoresService';

// GET /api/admin/portaria — contas ativas da portaria
export async function GET() {
  try {
    const session = await requireSession(GESTAO);
    return NextResponse.json({ contas: await listarPortaria(session) });
  } catch (err) {
    return handleError(err, 'admin/portaria');
  }
}

// POST /api/admin/portaria — cria a conta e envia o convite para definir a senha
export async function POST(request) {
  try {
    const session = await requireSession(GESTAO);
    const dados = parseWith(contaPortariaSchema, await readJson(request));
    return NextResponse.json({ conta: await criarPortaria(session, dados) }, { status: 201 });
  } catch (err) {
    return handleError(err, 'admin/portaria');
  }
}
