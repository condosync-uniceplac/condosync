'use client';

import { useCallback, useEffect, useState } from 'react';
import { enviarJson, lerResposta } from '@/lib/apiClient';

const VAZIO = { perfil: null, visitas: [], unidades: [] };
const ATUALIZAR_A_CADA_MS = 15_000;

/** Visitas da API (RF.10). Atualiza sozinho para a portaria ver as confirmações do morador. */
export function useVisitas() {
  const [dados, setDados] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

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

  useEffect(() => {
    recarregar();
    const timer = setInterval(recarregar, ATUALIZAR_A_CADA_MS);
    return () => clearInterval(timer);
  }, [recarregar]);

  const criar = useCallback(
    async (dadosVisita) => {
      const { visita } = await enviarJson('/api/visitas', 'POST', dadosVisita);
      await recarregar();
      return visita;
    },
    [recarregar],
  );

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
