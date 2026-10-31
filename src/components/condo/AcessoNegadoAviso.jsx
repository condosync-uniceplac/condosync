'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

// Aviso exibido quando o middleware barra o acesso a uma página (?erro=acesso-negado).
export default function AcessoNegadoAviso() {
  useEffect(() => {
    toast.error('Você não tem permissão para acessar aquela página.');
  }, []);
  return null;
}
