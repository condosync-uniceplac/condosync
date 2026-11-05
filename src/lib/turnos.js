/**
 * Turnos de reserva das áreas comuns (RF.09). Usado no servidor e na tela.
 * Os horários são do fuso do condomínio (Brasília, UTC-3, sem horário de verão).
 */
export const FUSO_CONDOMINIO = '-03:00';

export const TURNOS = Object.freeze([
  { id: 'MANHA', rotulo: 'Manhã (08h às 12h)', inicio: '08:00', fim: '12:00' },
  { id: 'TARDE', rotulo: 'Tarde (13h às 17h)', inicio: '13:00', fim: '17:00' },
  { id: 'NOITE', rotulo: 'Noite (18h às 23h)', inicio: '18:00', fim: '23:00' },
  { id: 'DIA', rotulo: 'Dia inteiro (08h às 23h)', inicio: '08:00', fim: '23:00' },
]);

export const TURNO_IDS = TURNOS.map((t) => t.id);

/** Antecedência mínima para o morador cancelar a própria reserva. */
export const ANTECEDENCIA_CANCELAMENTO_HORAS = 24;

/** Converte data (AAAA-MM-DD) + turno no intervalo [inicio, fim) em horário de Brasília. */
export function intervaloDoTurno(data, turnoId) {
  const turno = TURNOS.find((t) => t.id === turnoId);
  if (!turno) return null;
  return {
    inicio: new Date(`${data}T${turno.inicio}:00${FUSO_CONDOMINIO}`),
    fim: new Date(`${data}T${turno.fim}:00${FUSO_CONDOMINIO}`),
  };
}

/** Dois intervalos [a, b) e [c, d) se sobrepõem quando a < d e c < b. */
export function sobrepoe(a, b) {
  return new Date(a.inicio) < new Date(b.fim) && new Date(b.inicio) < new Date(a.fim);
}

const hora = (d) =>
  new Date(d).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Data AAAA-MM-DD de um instante, no fuso do condomínio. */
export function dataLocal(d) {
  return new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

/** Identifica o turno de uma reserva pelos horários (para exibir na tela). */
export function turnoDaReserva(inicio, fim) {
  const ini = hora(inicio);
  const f = hora(fim);
  return TURNOS.find((t) => t.inicio === ini && t.fim === f) ?? null;
}
