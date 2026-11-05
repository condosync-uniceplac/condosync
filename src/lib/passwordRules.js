/** Critérios da senha forte (RN.03) — os mesmos do senhaForteSchema, para a tela orientar antes do envio. */
export const CRITERIOS_SENHA = [
  { id: 'tamanho', texto: 'Pelo menos 8 caracteres', ok: (s) => s.length >= 8 },
  { id: 'maiuscula', texto: 'Uma letra maiúscula', ok: (s) => /[A-Z]/.test(s) },
  { id: 'minuscula', texto: 'Uma letra minúscula', ok: (s) => /[a-z]/.test(s) },
  { id: 'numero', texto: 'Um número', ok: (s) => /\d/.test(s) },
  {
    id: 'especial',
    texto: 'Um caractere especial (ex.: @ # ! %)',
    ok: (s) => /[^A-Za-z0-9]/.test(s),
  },
];

export function avaliarSenha(senha = '') {
  return CRITERIOS_SENHA.map((c) => ({ id: c.id, texto: c.texto, ok: c.ok(senha) }));
}
