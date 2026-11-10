/**
 * Envio de e-mails (recuperação de senha e convite da portaria) pelo serviço Resend.
 */

import { isProduction } from '@/lib/env';

/**
 * Envio de e-mail transacional.
 * Com RESEND_API_KEY e EMAIL_FROM definidos, envia pela API da Resend (https://resend.com).
 * Sem eles: em desenvolvimento, mostra a mensagem no console (para testar o fluxo);
 * em produção, apenas registra que o envio não está configurado, sem expor o conteúdo.
 */
export async function enviarEmail({ para, assunto, texto, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const remetente = process.env.EMAIL_FROM;

  if (!apiKey || !remetente) {
    if (isProduction()) {
      console.warn('[email] RESEND_API_KEY/EMAIL_FROM não configurados; e-mail não enviado.');
    } else {
      console.info(`[email:dev] Para: ${para}\nAssunto: ${assunto}\n\n${texto}`);
    }
    return { enviado: false };
  }

  // Chama a API da Resend com o remetente, o destinatário, o assunto e o texto.
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: remetente, to: [para], subject: assunto, text: texto, html }),
  });
  if (!res.ok) {
    // Não propaga o erro ao usuário: a resposta da recuperação de senha é sempre a mesma
    console.error(`[email] falha no envio (HTTP ${res.status})`);
    return { enviado: false };
  }
  return { enviado: true };
}
