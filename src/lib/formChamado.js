import { AppError } from './errors';
import { parseWith } from './http';
import { chamadoSchema } from './validators';

/** Lê o formulário multipart do chamado: campos de texto + foto opcional. */
export async function lerFormularioChamado(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    throw new AppError(400, 'Envie o chamado como formulário (multipart/form-data).');
  }
  const dados = parseWith(chamadoSchema, {
    titulo: form.get('titulo') ?? undefined,
    descricao: form.get('descricao') ?? undefined,
    categoriaId: form.get('categoriaId') ?? undefined,
    urgencia: form.get('urgencia') ?? undefined,
  });
  const file = form.get('anexo');
  const arquivo =
    file && typeof file === 'object' && file.size > 0
      ? { nome: file.name, conteudo: Buffer.from(await file.arrayBuffer()) }
      : null;
  return { dados, arquivo };
}
