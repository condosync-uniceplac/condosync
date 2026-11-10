'use client';

/**
 * Hook das telas de portaria e de visitantes: busca as visitas na API e executa as ações.
 */

import { useCallback, useEffect, useState } from 'react';
import { enviarJson, lerResposta } from '@/lib/apiClient';

// Estado inicial e intervalo da atualização automática (15 segundos).
const VAZIO = { perfil: null, visitas: [], unidades: [] };
const ATUALIZAR_A_CADA_MS = 15_000;

/** Visitas da API (RF.10). Atualiza sozinho para a portaria ver as confirmações do morador. */
export function useVisitas() {
  const [dados, setDados] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Busca as visitas de novo na API.
  const recarregar = useCallback(async () => {
    try {
      setDados(await lerResposta(await fetch('/api/visitas', { cache: 'no-store' })));
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Carrega ao abrir e repete a cada 15 s; para o timer ao sair da tela.
  useEffect(() => {
    recarregar();
    const timer = setInterval(recarregar, ATUALIZAR_A_CADA_MS);
    return () => clearInterval(timer);
  }, [recarregar]);

  // Registra uma visita (pré-autorização do morador ou não prevista da portaria).
  const criar = useCallback(
    async (dadosVisita) => {
      const { visita } = await enviarJson('/api/visitas', 'POST', dadosVisita);
      await recarregar();
      return visita;
    },
    [recarregar],
  );

  // Executa uma ação na visita: autorizar, recusar, cancelar, entrada ou saída.
  const acao = useCallback(
    async (id, nome) => {
      const r = await enviarJson(`/api/visitas/${id}`, 'PATCH', { acao: nome });
      await recarregar();
      return r;
    },
    [recarregar],
  );

  return { ...dados, carregando, erro, criar, acao, recarregar };
}
