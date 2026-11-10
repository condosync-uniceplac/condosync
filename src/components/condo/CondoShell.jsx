'use client';

import { CondoProvider } from '@/lib/condo-store';
import { Toaster } from '@/components/ui/sonner';

// Envolve as telas do painel com a sessão real (usuário logado e condomínio).
// A classe `condo-app` ativa o estilo de fundo/fonte do painel (ver app/condo.css).
export default function CondoShell({ sessao, usuario, condominio, children }) {
  return (
    <CondoProvider sessao={sessao} usuario={usuario} condominio={condominio}>
      <div className="condo-app contents">{children}</div>
      <Toaster position="top-right" richColors />
    </CondoProvider>
  );
}
