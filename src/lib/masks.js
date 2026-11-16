/**
 * Máscaras de exibição: CPF, telefone, documento de visitante (LGPD) e placa de veículo.
 */

// Deixa só os dígitos do valor, limitado a `max` caracteres.
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

/**
 * Valor em centavos -> "R$ 1.234,56" (campo de dinheiro estilo Pix).
 * Os centavos evitam erro de arredondamento com números quebrados.
 */
export function formatMoeda(centavos) {
  const n = Number(centavos) || 0;
  return (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Novo valor (em centavos) do campo de dinheiro estilo Pix, a partir do texto anterior e do novo.
 * Não importa onde está o cursor: dígitos digitados entram pela direita (1 -> R$ 0,01,
 * depois 5 -> R$ 0,15, 0 -> R$ 1,50...) e cada dígito apagado volta uma casa.
 */
export function proximoValorMoeda(centavos, textoAnterior, textoNovo, maximo = 10_000_000) {
  const antes = String(textoAnterior ?? '');
  const depois = String(textoNovo ?? '');
  // Texto todo trocado (ex.: selecionou tudo e colou "150"): lê o valor do zero.
  if (!depois.includes(',')) return centavosDoTexto(depois, maximo);
  // Acha o trecho que mudou comparando o começo e o fim dos dois textos.
  let ini = 0;
  while (ini < antes.length && ini < depois.length && antes[ini] === depois[ini]) ini += 1;
  let fim = 0;
  while (
    fim < antes.length - ini &&
    fim < depois.length - ini &&
    antes[antes.length - 1 - fim] === depois[depois.length - 1 - fim]
  )
    fim += 1;
  const inseridos = depois.slice(ini, depois.length - fim).replace(/\D/g, '');
  const removidos = antes.slice(ini, antes.length - fim).replace(/\D/g, '').length;
  let valor = Math.floor((Number(centavos) || 0) / 10 ** removidos);
  for (const d of inseridos) valor = valor * 10 + Number(d);
  return Math.min(valor, maximo);
}

/**
 * Texto digitado no campo de dinheiro -> centavos. Só os dígitos contam, da direita para a
 * esquerda, como no Pix: 1 -> R$ 0,01; 15 -> R$ 0,15; 150 -> R$ 1,50; 15000 -> R$ 150,00.
 */
export function centavosDoTexto(texto, maximo = 10_000_000) {
  const digitos = String(texto ?? '')
    .replace(/\D/g, '')
    .slice(-9);
  return Math.min(Number(digitos || 0), maximo);
}
