'use client';

import { useCallback, useEffect, useState } from 'react';
import { enviarJson, lerResposta } from '@/lib/apiClient';

export const EVENTO_CHAMADOS = 'condosync:chamados-atualizados';
const avisar = () => window.dispatchEvent(new Event(EVENTO_CHAMADOS));

const detalhar = (id) => fetch(`/api/chamados/${id}`, { cache: 'no-store' }).then(lerResposta);

/** Chamados vindos da API (RN.22): morador vê os próprios; portaria e síndico, todos. */
export function useChamados() {
  const [dados, setDados] = useState({
    perfil: null,
    podeComentar: false,
    categorias: [],
    chamados: [],
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    try {
      setDados(await lerResposta(await fetch('/api/chamados', { cache: 'no-store' })));
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

  const depois = useCallback(
    async (promessa) => {
      const r = await promessa;
      await recarregar();
      avisar();
      return r;
    },
    [recarregar],
  );

  return {
    ...dados,
    carregando,
    erro,
    recarregar,
    abrir: (formData) =>
      depois(fetch('/api/chamados', { method: 'POST', body: formData }).then(lerResposta)),
    alterarStatus: (id, status, comentario) =>
      depois(enviarJson(`/api/chamados/${id}`, 'PATCH', { status, comentario })),
    comentar: (id, comentario) =>
      depois(enviarJson(`/api/chamados/${id}/acompanhamentos`, 'POST', { comentario })),
    detalhar,
  };
}

/** Quantidade de chamados não resolvidos (Visão Geral). */
export function useChamadosAbertos() {
  const [abertos, setAbertos] = useState(null);
  useEffect(() => {
    const carregar = () =>
      fetch('/api/chamados/resumo', { cache: 'no-store' })
        .then(lerResposta)
        .then((d) => setAbertos(d.abertos))
        .catch(() => {});
    carregar();
    window.addEventListener(EVENTO_CHAMADOS, carregar);
    return () => window.removeEventListener(EVENTO_CHAMADOS, carregar);
  }, []);
  return abertos;
}
