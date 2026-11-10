import { AppError } from './errors';
import { parseWith } from './http';
import { avisoSchema } from './validators';

/** Lê o formulário multipart do aviso: campos de texto + anexo opcional. */
export async function lerFormularioAviso(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    throw new AppError(400, 'Envie o aviso como formulário (multipart/form-data).');
  }
  const dados = parseWith(avisoSchema, {
    titulo: form.get('titulo') ?? undefined,
    corpo: form.get('corpo') ?? undefined,
    categoriaId: form.get('categoriaId') ?? undefined,
    prioridade: form.get('prioridade') ?? undefined,
  });
  const file = form.get('anexo');
  const arquivo =
    file && typeof file === 'object' && file.size > 0
      ? { nome: file.name, conteudo: Buffer.from(await file.arrayBuffer()) }
      : null;
  return { dados, arquivo, removerAnexo: form.get('removerAnexo') === 'true' };
}
