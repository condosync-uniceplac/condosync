'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
export const ESPACOS = [
  {
    id: 'salao',
    nome: 'Salão de Festas Nobre',
    descricao: 'Ambiente climatizado com copa, som ambiente e mobiliário completo.',
    capacidade: 120,
    taxa: 'R$ 350,00',
  },
  {
    id: 'churrasqueira',
    nome: 'Churrasqueira Gourmet 01',
    descricao: 'Espaço externo com bancada, forno de pizza e mesas para 30 pessoas.',
    capacidade: 30,
    taxa: 'R$ 120,00',
  },
  {
    id: 'quadra',
    nome: 'Quadra Poliesportiva',
    descricao: 'Piso oficial, iluminação noturna e vestiários anexos.',
    capacidade: 40,
    taxa: 'Isento',
  },
  {
    id: 'academia',
    nome: 'Academia',
    descricao: 'Equipamentos de musculação e área de alongamento com uso por turnos.',
    capacidade: 12,
    taxa: 'Isento',
  },
];
export const TURNOS = [
  'Manhã (08h às 12h)',
  'Tarde (13h às 17h)',
  'Noite (18h às 23h)',
  'Dia inteiro (08h às 23h)',
];
const hoje = new Date();
const iso = (deslocamentoDias) => {
  const d = new Date(hoje);
  d.setDate(d.getDate() + deslocamentoDias);
  return d.toISOString().slice(0, 10);
};
export const formatarData = (valor) => {
  const [a, m, d] = valor.split('-');
  return `${d}/${m}/${a}`;
};
const estadoInicial = {
  sessao: null,
  reservas: [
    {
      id: 'r1',
      espacoId: 'salao',
      espaco: 'Salão de Festas Nobre',
      data: iso(3),
      turno: 'Noite (18h às 23h)',
      responsavel: 'Marcos Souza',
      unidade: 'Apto 104 - Bloco B',
      convidados: 45,
    },
    {
      id: 'r2',
      espacoId: 'churrasqueira',
      espaco: 'Churrasqueira Gourmet 01',
      data: iso(1),
      turno: 'Tarde (13h às 17h)',
      responsavel: 'Fernanda Lima Barreto',
      unidade: 'Apto 302 - Bloco A',
      convidados: 18,
    },
    {
      id: 'r3',
      espacoId: 'quadra',
      espaco: 'Quadra Poliesportiva',
      data: iso(5),
      turno: 'Manhã (08h às 12h)',
      responsavel: 'Marcos Souza',
      unidade: 'Apto 104 - Bloco B',
      convidados: 10,
    },
  ],
  visitantes: [
    {
      id: 'v1',
      nome: 'Paulo Henrique Tavares',
      documento: 'MG-14.882.331',
      unidade: 'Apto 104 - Bloco B',
      placa: 'QRS-4C87',
      previsao: '14:30',
      status: 'aguardando',
    },
    {
      id: 'v2',
      nome: 'Aline Rodrigues Pinto',
      documento: 'CPF 384.221.900-12',
      unidade: 'Apto 302 - Bloco A',
      placa: '—',
      previsao: '09:15',
      status: 'no-condominio',
      entrada: '09:12',
    },
    {
      id: 'v3',
      nome: 'Transportadora Vale Sul',
      documento: 'CNPJ 12.884.001/0001-40',
      unidade: 'Apto 701 - Bloco C',
      placa: 'LKM-2H09',
      previsao: '08:00',
      status: 'concluido',
      entrada: '08:05',
      saida: '08:41',
    },
  ],
  avisos: [
    {
      id: 'a1',
      titulo: 'Interrupção no fornecimento de água na terça-feira',
      texto:
        'A manutenção preventiva das bombas do reservatório superior ocorrerá das 09h às 14h. Recomendamos armazenar água para consumo.',
      categoria: 'Obras',
      prioridade: 'Urgente',
      data: iso(-1),
      autor: 'Administração CondoSync',
      anexo: 'cronograma-manutencao.pdf',
      leituras: 42,
      lido: false,
    },
    {
      id: 'a2',
      titulo: 'Convocação: Assembleia Geral Ordinária',
      texto:
        'Pauta: prestação de contas do exercício, previsão orçamentária e eleição do conselho fiscal. Presença híbrida no salão nobre.',
      categoria: 'Assembleias',
      prioridade: 'Manutenção',
      data: iso(-3),
      autor: 'Carlos Eduardo Mendes',
      anexo: 'edital-assembleia.pdf',
      leituras: 87,
      lido: false,
    },
    {
      id: 'a3',
      titulo: 'Festa Junina dos moradores',
      texto:
        'Inscrições abertas para as barracas de comidas típicas. A confraternização acontece na quadra poliesportiva.',
      categoria: 'Normas',
      prioridade: 'Social',
      data: iso(-6),
      autor: 'Comissão de Eventos',
      leituras: 63,
      lido: true,
    },
    {
      id: 'a4',
      titulo: 'Reajuste da taxa condominial a partir do próximo mês',
      texto:
        'Aprovado em assembleia o reajuste de 4,2% referente ao acordo coletivo dos funcionários. Boletos já atualizados.',
      categoria: 'Financeiro',
      prioridade: 'Manutenção',
      data: iso(-9),
      autor: 'Administradora Pátio Gestão',
      anexo: 'planilha-orcamento.pdf',
      leituras: 118,
      lido: true,
    },
  ],
  chamados: [
    {
      id: 'c1',
      titulo: 'Barulho excessivo após as 23h',
      categoria: 'Barulho',
      descricao: 'Som alto vindo do apartamento vizinho durante a madrugada de sábado.',
      urgencia: 'Média',
      status: 'aberto',
      autor: 'Marcos Souza',
      unidade: 'Apto 104 - Bloco B',
      data: iso(-1),
    },
    {
      id: 'c2',
      titulo: 'Vaga de garagem ocupada indevidamente',
      categoria: 'Vaga de Garagem',
      descricao: 'Veículo desconhecido estacionado na vaga 118 há dois dias.',
      urgencia: 'Alta',
      status: 'analise',
      autor: 'Fernanda Lima Barreto',
      unidade: 'Apto 302 - Bloco A',
      data: iso(-2),
      anexo: 'foto-vaga.jpg',
    },
    {
      id: 'c3',
      titulo: 'Lâmpada queimada na escada do Bloco C',
      categoria: 'Manutenção',
      descricao: 'Iluminação do 4º andar apagada desde quinta-feira.',
      urgencia: 'Baixa',
      status: 'resolvido',
      autor: 'Juliana Ferreira',
      unidade: 'Apto 701 - Bloco C',
      data: iso(-5),
    },
  ],
  enquetes: [
    {
      id: 'e1',
      pergunta: 'Devemos instalar câmeras adicionais no subsolo?',
      descricao: 'Investimento estimado de R$ 18.400,00 com uso do fundo de reserva.',
      encerraEm: iso(4),
      opcoes: [
        { id: 'o1', texto: 'Sim, aprovar a instalação', votos: 84 },
        { id: 'o2', texto: 'Não, manter como está', votos: 21 },
        { id: 'o3', texto: 'Adiar para a próxima assembleia', votos: 13 },
      ],
    },
    {
      id: 'e2',
      pergunta: 'Novo horário de funcionamento da academia',
      descricao: 'Proposta de ampliação do horário nos finais de semana.',
      encerraEm: iso(9),
      opcoes: [
        { id: 'o1', texto: '06h às 23h todos os dias', votos: 57 },
        { id: 'o2', texto: 'Manter 06h às 22h', votos: 34 },
      ],
    },
  ],
};
const CondoContext = createContext(null);
const CHAVE = 'condosync-estado';
// `sessao` e `usuario` vêm do login real (servidor); o restante são dados de demonstração.
export function CondoProvider({ children, sessao, usuario }) {
  const [estado, setEstado] = useState({ ...estadoInicial, sessao });
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) setEstado({ ...JSON.parse(salvo), sessao });
    } catch {
      /* ignora */
    }
  }, [sessao]);
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ ...estado, sessao: null }));
    } catch {
      /* ignora */
    }
  }, [estado]);
  const horaAgora = () =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const criarReserva = useCallback((dados) => {
    let resultado = { ok: true, mensagem: 'Reserva confirmada com sucesso!' };
    setEstado((e) => {
      const conflito = e.reservas.some(
        (r) =>
          r.espacoId === dados.espacoId &&
          r.data === dados.data &&
          (r.turno === dados.turno ||
            r.turno.startsWith('Dia inteiro') ||
            dados.turno.startsWith('Dia inteiro')),
      );
      if (conflito) {
        resultado = {
          ok: false,
          mensagem: 'Já existe uma reserva para este espaço nesta data e turno.',
        };
        return e;
      }
      return {
        ...e,
        reservas: [{ ...dados, id: crypto.randomUUID() }, ...e.reservas],
      };
    });
    return resultado;
  }, []);
  const cancelarReserva = useCallback((id) => {
    setEstado((e) => ({ ...e, reservas: e.reservas.filter((r) => r.id !== id) }));
  }, []);
  const criarVisitante = useCallback((dados) => {
    setEstado((e) => ({
      ...e,
      visitantes: [{ ...dados, id: crypto.randomUUID(), status: 'aguardando' }, ...e.visitantes],
    }));
  }, []);
  const atualizarVisitante = useCallback((id, status) => {
    setEstado((e) => ({
      ...e,
      visitantes: e.visitantes.map((v) => {
        if (v.id !== id) return v;
        const atualizado = { ...v, status };
        if (status === 'no-condominio') atualizado.entrada = horaAgora();
        if (status === 'concluido') atualizado.saida = horaAgora();
        return atualizado;
      }),
    }));
  }, []);
  const gerarPasse = useCallback((id) => {
    const codigo = `CS-${Math.floor(100000 + Math.random() * 899999)}`;
    setEstado((e) => ({
      ...e,
      visitantes: e.visitantes.map((v) => (v.id === id ? { ...v, passe: codigo } : v)),
    }));
    return codigo;
  }, []);
  const marcarLido = useCallback((id) => {
    setEstado((e) => ({
      ...e,
      avisos: e.avisos.map((a) =>
        a.id === id && !a.lido ? { ...a, lido: true, leituras: a.leituras + 1 } : a,
      ),
    }));
  }, []);
  const criarChamado = useCallback((dados) => {
    setEstado((e) => ({
      ...e,
      chamados: [
        {
          ...dados,
          id: crypto.randomUUID(),
          status: 'aberto',
          data: new Date().toISOString().slice(0, 10),
        },
        ...e.chamados,
      ],
    }));
  }, []);
  const moverChamado = useCallback((id, status) => {
    setEstado((e) => ({
      ...e,
      chamados: e.chamados.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
  }, []);
  const votar = useCallback((enqueteId, opcaoId) => {
    setEstado((e) => ({
      ...e,
      enquetes: e.enquetes.map((q) => {
        if (q.id !== enqueteId) return q;
        const anterior = q.votoDoUsuario;
        if (anterior === opcaoId) return q;
        return {
          ...q,
          votoDoUsuario: opcaoId,
          opcoes: q.opcoes.map((o) => ({
            ...o,
            votos: o.votos + (o.id === opcaoId ? 1 : 0) - (o.id === anterior ? 1 : 0),
          })),
        };
      }),
    }));
  }, []);
  const valor = useMemo(
    () => ({
      estado,
      usuario,
      criarReserva,
      cancelarReserva,
      criarVisitante,
      atualizarVisitante,
      gerarPasse,
      marcarLido,
      criarChamado,
      moverChamado,
      votar,
    }),
    [
      estado,
      usuario,
      criarReserva,
      cancelarReserva,
      criarVisitante,
      atualizarVisitante,
      gerarPasse,
      marcarLido,
      criarChamado,
      moverChamado,
      votar,
    ],
  );
  return <CondoContext.Provider value={valor}>{children}</CondoContext.Provider>;
}
export function useCondo() {
  const ctx = useContext(CondoContext);
  if (!ctx) throw new Error('useCondo precisa estar dentro de CondoProvider');
  return ctx;
}
