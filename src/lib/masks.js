const digitos = (v, max) =>
  String(v ?? '')
    .replace(/\D/g, '')
    .slice(0, max);

/** 52998224725 -> 529.982.247-25 (formata enquanto a pessoa digita). */
export function formatCpf(valor) {
  const d = digitos(valor, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

/** 61999990000 -> (61) 99999-0000 · 6133330000 -> (61) 3333-0000 */
export function formatTelefone(valor) {
  const d = digitos(valor, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const meio = resto.length === 9 ? 5 : 4; // celular (9 dígitos) ou fixo (8)
  return `(${ddd}) ${resto.slice(0, meio)}-${resto.slice(meio)}`;
}
