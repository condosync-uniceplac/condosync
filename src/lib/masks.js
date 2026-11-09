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

/**
 * Documento de visitante mascarado para listagens (LGPD):
 * CPF 38422190012 -> 384.***.***-12; outros documentos mostram só os 3 últimos caracteres.
 */
export function mascararDocumento(tipo, documento) {
  const doc = String(documento ?? '');
  if (tipo === 'CPF' && /^\d{11}$/.test(doc)) return `${doc.slice(0, 3)}.***.***-${doc.slice(9)}`;
  if (doc.length <= 3) return '***';
  return `${'*'.repeat(doc.length - 3)}${doc.slice(-3)}`;
}

/** Placa antiga (ABC1234) ou Mercosul (ABC1D23) -> ABC-1234 / ABC1D23. */
export function formatPlaca(placa) {
  const p = String(placa ?? '').toUpperCase();
  return /^[A-Z]{3}\d{4}$/.test(p) ? `${p.slice(0, 3)}-${p.slice(3)}` : p;
}
