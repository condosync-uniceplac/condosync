'use client';

/**
 * Hooks das enquetes: lista, cria, vota e encerra; e o contador de votações abertas.
 */

import { useCallback, useEffect, useState } from 'react';
import { enviarJson, lerResposta } from '@/lib/apiClient';

// Evento disparado quando uma enquete muda.
export const EVENTO_ENQUETES = 'condosync:enquetes-atualizadas';

/** Enquetes vindas da API (RN.24: um voto por unidade). */
export function useEnquetes() {
  const [dados, setDados] = useState({ podeCriar: false, podeVotar: false, enquetes: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Busca as enquetes na API.
  const recarregar = useCallback(async () => {
    try {
      setDados(await lerResposta(await fetch('/api/enquetes', { cache: 'no-store' })));
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  // Depois de qualquer ação (mesmo com erro): recarrega a lista e avisa o contador.
  const depois = useCallback(
    async (promessa) => {
      try {
        return await promessa;
      } finally {
        await recarregar();
        window.dispatchEvent(new Event(EVENTO_ENQUETES));
      }
    },
    [recarregar],
  );

  return {
    ...dados,
    carregando,
    erro,
    criar: (corpo) => depois(enviarJson('/api/enquetes', 'POST', corpo)),
    votar: (id, opcaoId) => depois(enviarJson(`/api/enquetes/${id}/voto`, 'PUT', { opcaoId })),
    encerrar: (id) => depois(enviarJson(`/api/enquetes/${id}/encerrar`, 'POST', {})),
  };
}

/** Quantidade de votações abertas (Visão Geral). */
export function useEnquetesAbertas() {
  const [abertas, setAbertas] = useState(null);
  useEffect(() => {
    const carregar = () =>
      fetch('/api/enquetes/resumo', { cache: 'no-store' })
        .then(lerResposta)
        .then((d) => setAbertas(d.abertas))
        .catch(() => {});
    carregar();
    window.addEventListener(EVENTO_ENQUETES, carregar);
    return () => window.removeEventListener(EVENTO_ENQUETES, carregar);
  }, []);
  return abertas;
}
