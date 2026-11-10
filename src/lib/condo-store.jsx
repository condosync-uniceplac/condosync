'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
// Reservas, visitas e avisos já vêm do banco (useReservas, useVisitas, useAvisos); os demais módulos serão migrados nas próximas sprints.
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
      criarChamado,
      moverChamado,
      votar,
    }),
    [estado, usuario, criarChamado, moverChamado, votar],
  );
  return <CondoContext.Provider value={valor}>{children}</CondoContext.Provider>;
}
export function useCondo() {
  const ctx = useContext(CondoContext);
  if (!ctx) throw new Error('useCondo precisa estar dentro de CondoProvider');
  return ctx;
}
