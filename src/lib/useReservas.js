'use client';

import { useCallback, useEffect, useState } from 'react';
import { lerResposta } from '@/lib/apiClient';

const VAZIO = { podeReservar: false, espacos: [], reservas: [], ocupacao: [] };

/** Reservas do condomínio vindas da API (RF.09). */
export function useReservas() {
  const [dados, setDados] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

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

  useEffect(() => {
    recarregar();
  }, [recarregar]);

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

  const cancelar = useCallback(
    async (id) => {
      await lerResposta(await fetch(`/api/reservas/${id}`, { method: 'DELETE' }));
      await recarregar();
    },
    [recarregar],
  );

  return { ...dados, carregando, erro, criar, cancelar, recarregar };
}
