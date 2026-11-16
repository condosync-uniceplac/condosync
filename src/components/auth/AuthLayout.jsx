/**
 * Moldura das telas de acesso (login, cadastro, esqueci/redefinir senha), no mesmo visual do painel:
 * no computador, painel azul-escuro à esquerda (logo, frase e destaques) e o formulário à direita;
 * no celular, uma coluna só com o logo em cima.
 */

import { Building2, CalendarCheck2, Megaphone, ShieldCheck } from 'lucide-react';
import { LogoCondoSync } from '@/components/condo/Logo';

// Destaques do sistema mostrados no painel lateral.
const DESTAQUES = [
  {
    icone: CalendarCheck2,
    titulo: 'Reservas sem conflito',
    texto: 'Salão, churrasqueira e quadra por turno, direto pelo app.',
  },
  {
    icone: ShieldCheck,
    titulo: 'Portaria conectada',
    texto: 'Visitantes pré-autorizados e confirmação em tempo real.',
  },
  {
    icone: Megaphone,
    titulo: 'Comunicação e decisões',
    texto: 'Mural de avisos, chamados e enquetes por unidade.',
  },
];

export function AuthLayout({ titulo, subtitulo, children, largo = false }) {
  return (
    <main className="condo-app grid min-h-screen bg-background font-sans lg:grid-cols-[minmax(420px,5fr)_7fr]">
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 lg:sticky lg:top-0 lg:h-screen text-sidebar-foreground lg:flex lg:flex-col">
        {/* Formas decorativas ao fundo */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <LogoCondoSync tom="claro" tamanho="lg" className="relative" />
        <div className="relative mt-auto mb-auto max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
            O condomínio inteiro <span className="text-primary">na palma da mão</span>.
          </h2>
          <p className="mt-3 text-sm text-sidebar-foreground/70">
            Moradores, portaria e síndico na mesma plataforma, cada um com o que precisa.
          </p>
          <ul className="mt-10 space-y-6">
            {DESTAQUES.map(({ icone: Icone, titulo: t, texto }) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icone className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold">{t}</span>
                  <span className="block text-sm text-sidebar-foreground/65">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-sidebar-foreground/50">
          <Building2 className="h-3.5 w-3.5" /> Projeto Integrado · UNICEPLAC
        </p>
      </aside>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className={largo ? 'w-full max-w-xl' : 'w-full max-w-sm'}>
          <LogoCondoSync className="mb-10 lg:hidden" />
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{titulo}</h1>
          {subtitulo && <p className="mt-1.5 text-sm text-muted-foreground">{subtitulo}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
