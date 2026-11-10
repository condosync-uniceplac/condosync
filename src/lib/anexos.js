/**
 * Validação de anexos do mural: PDF, PNG ou JPG de até 2 MB.
 * O tipo é conferido pelos primeiros bytes do arquivo (não só pela extensão),
 * para não aceitar, por exemplo, um executável renomeado para .pdf.
 */
export const TAMANHO_MAX_ANEXO = 2 * 1024 * 1024;

const ASSINATURAS = [
  { mime: 'application/pdf', ext: ['pdf'], bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: 'image/png', ext: ['png'], bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/jpeg', ext: ['jpg', 'jpeg'], bytes: [0xff, 0xd8, 0xff] },
];

/** Retorna { mime } se o arquivo for aceito, ou { erro } explicando o motivo. */
export function validarAnexo(nome, buffer) {
  if (!buffer || buffer.length === 0) return { erro: 'O arquivo está vazio.' };
  if (buffer.length > TAMANHO_MAX_ANEXO) return { erro: 'O anexo deve ter no máximo 2 MB.' };
  const ext = String(nome).split('.').pop().toLowerCase();
  const tipo = ASSINATURAS.find((t) => t.ext.includes(ext));
  if (!tipo) return { erro: 'Envie um arquivo PDF, PNG ou JPG.' };
  const confere = tipo.bytes.every((b, i) => buffer[i] === b);
  if (!confere) return { erro: 'O conteúdo do arquivo não corresponde à extensão.' };
  return { mime: tipo.mime };
}

/** Nome seguro para o cabeçalho de download (sem barras nem caracteres de controle). */
export function nomeSeguro(nome) {
  const limpo = String(nome)
    .replace(/[/\\]/g, '_')
    .replace(/[\x00-\x1f"]/g, '')
    .trim();
  return limpo.slice(-120) || 'anexo';
}
