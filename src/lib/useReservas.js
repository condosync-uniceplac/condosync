'use client';

/**
 * Hook das telas de reservas: busca espaços e reservas na API e oferece criar/cancelar.
 */

import { useCallback, useEffect, useState } from 'react';
import { lerResposta } from '@/lib/apiClient';

// Estado inicial enquanto os dados não chegam.
const VAZIO = { podeReservar: false, espacos: [], reservas: [], ocupacao: [] };

/** Reservas do condomínio vindas da API (RF.09). */
export function useReservas() {
  const [dados, setDados] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Busca os dados de novo na API (cache desligado para vir sempre atualizado).
  const recarregar = useCallback(async () => {
    try {
      setDados(await lerResposta(await fetch('/api/reservas', { cache: 'no-store' })));
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Carrega ao abrir a tela.
  useEffect(() => {
    recarregar();
  }, [recarregar]);

  // Cria a reserva e recarrega a lista.
  const criar = useCallback(
    async (reserva) => {
      const corpo = await lerResposta(
        await fetch('/api/reservas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reserva),
        }),
      );
      await recarregar();
      return corpo.reserva;
    },
    [recarregar],
  );

  // Cancela a reserva e recarrega a lista.
  const cancelar = useCallback(
    async (id) => {
      await lerResposta(await fetch(`/api/reservas/${id}`, { method: 'DELETE' }));
      await recarregar();
    },
    [recarregar],
  );

  return { ...dados, carregando, erro, criar, cancelar, recarregar };
}
