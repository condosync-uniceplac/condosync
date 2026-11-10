'use client';

/**
 * Logotipo do CondoSync desenhado em SVG (só o símbolo, ou símbolo + nome).
 */

import { cn } from '@/lib/utils';
export function LogoMarca({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('h-10 w-10', className)} aria-hidden="true">
      <circle cx="32" cy="34" r="26" className="fill-primary" />
      <path
        d="M8 28 L32 8 L56 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g
        fill="none"
        stroke="var(--color-primary-foreground)"
        strokeWidth="3"
        strokeLinejoin="round"
      >
        <rect x="18" y="30" width="12" height="20" rx="1.5" />
        <rect x="34" y="24" width="12" height="26" rx="1.5" />
        <line x1="22" y1="36" x2="26" y2="36" strokeLinecap="round" />
        <line x1="22" y1="42" x2="26" y2="42" strokeLinecap="round" />
        <line x1="38" y1="31" x2="42" y2="31" strokeLinecap="round" />
        <line x1="38" y1="37" x2="42" y2="37" strokeLinecap="round" />
        <line x1="38" y1="43" x2="42" y2="43" strokeLinecap="round" />
      </g>
    </svg>
  );
}
export function LogoCondoSync({ className, tom = 'escuro', tamanho = 'md' }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoMarca
        className={cn(
          tamanho === 'lg' ? 'h-14 w-14' : 'h-10 w-10',
          tom === 'claro' ? 'text-primary-foreground' : 'text-brand-dark',
        )}
      />
      <div className="leading-tight">
        <p
          className={cn(
            'font-extrabold tracking-tight',
            tamanho === 'lg' ? 'text-3xl' : 'text-xl',
            tom === 'claro' ? 'text-sidebar-foreground' : 'text-brand-dark',
          )}
        >
          Condo<span className="text-primary">Sync</span>
        </p>
        <p
          className={cn(
            'text-[9px] font-semibold uppercase tracking-[0.16em]',
            tom === 'claro' ? 'text-sidebar-foreground/60' : 'text-muted-foreground',
            tamanho === 'lg' && 'text-[10px]',
          )}
        >
          Gestão inteligente para condomínios
        </p>
      </div>
    </div>
  );
}
