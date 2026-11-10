'use client';

/**
 * Hooks do mural de avisos: lista, publica, edita, remove e confirma leitura;
 * e o contador de não lidos usado no menu e no sino.
 */

import { useCallback, useEffect, useState } from 'react';
import { lerResposta } from '@/lib/apiClient';

// Evento do navegador disparado quando o mural muda, para o contador do sino se atualizar.
export const EVENTO_AVISOS = 'condosync:avisos-atualizados';
const avisar = () => window.dispatchEvent(new Event(EVENTO_AVISOS));

/** Mural de avisos vindo da API (RN.20). */
export function useAvisos(categoriaId) {
  const [dados, setDados] = useState({ podePublicar: false, categorias: [], avisos: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Busca o mural na API (com o filtro de categoria, se houver).
  const recarregar = useCallback(async () => {
    try {
      const qs = categoriaId ? `?categoriaId=${categoriaId}` : '';
      setDados(await lerResposta(await fetch(`/api/avisos${qs}`, { cache: 'no-store' })));
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [categoriaId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  // Envia o formulário para a API, recarrega o mural e avisa o contador.
  const enviar = useCallback(
    async (url, method, formData) => {
      const r = await lerResposta(await fetch(url, { method, body: formData }));
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
    publicar: (formData) => enviar('/api/avisos', 'POST', formData),
    editar: (id, formData) => enviar(`/api/avisos/${id}`, 'PUT', formData),
    remover: (id) => enviar(`/api/avisos/${id}`, 'DELETE'),
    confirmarLeitura: (id) => enviar(`/api/avisos/${id}/leitura`, 'POST'),
  };
}

/** Quantidade de avisos não lidos (menu e sino), atualizada quando o mural muda. */
export function useAvisosNaoLidos(ativo = true) {
  const [naoLidos, setNaoLidos] = useState(0);
  useEffect(() => {
    if (!ativo) return undefined;
    const carregar = () =>
      fetch('/api/avisos/resumo', { cache: 'no-store' })
        .then(lerResposta)
        .then((d) => setNaoLidos(d.naoLidos))
        .catch(() => {});
    carregar();
    window.addEventListener(EVENTO_AVISOS, carregar);
    return () => window.removeEventListener(EVENTO_AVISOS, carregar);
  }, [ativo]);
  return naoLidos;
}
