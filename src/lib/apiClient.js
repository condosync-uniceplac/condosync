/** Lê a resposta da API; em erro, lança a mensagem do primeiro campo inválido ou a geral. */
export async function lerResposta(res) {
  const corpo = await res.json().catch(() => ({}));
  if (!res.ok) {
    const campo = corpo.fields && Object.values(corpo.fields)[0];
    throw new Error(campo || corpo.error || 'Não foi possível concluir a operação.');
  }
  return corpo;
}

export const enviarJson = (url, method, corpo) =>
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  }).then(lerResposta);
