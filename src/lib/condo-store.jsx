'use client';

/**
 * Contexto React do painel: deixa o usuário logado e o condomínio disponíveis para todas as telas.
 */

import { createContext, useContext, useEffect, useMemo } from 'react';

const CondoContext = createContext(null);
// Chave do antigo estado de demonstração (Sprints 1 e 2), apagada do navegador.
const CHAVE_ANTIGA = 'condosync-estado';

/**
 * `sessao` e `usuario` vêm do login real (servidor). Todos os módulos já buscam
 * os dados na API (useReservas, useVisitas, useAvisos, useChamados, useEnquetes);
 * o contexto só distribui quem está logado e o condomínio da sessão.
 */
export function CondoProvider({ children, sessao, usuario, condominio }) {
  useEffect(() => {
    try {
      localStorage.removeItem(CHAVE_ANTIGA);
    } catch {
      /* ignora */
    }
  }, []);
  const valor = useMemo(
    () => ({ estado: { sessao }, usuario, condominio }),
    [sessao, usuario, condominio],
  );
  return <CondoContext.Provider value={valor}>{children}</CondoContext.Provider>;
}

// Atalho para as telas lerem o contexto (usuário, perfil e condomínio).
export function useCondo() {
  const ctx = useContext(CondoContext);
  if (!ctx) throw new Error('useCondo precisa estar dentro de CondoProvider');
  return ctx;
}
