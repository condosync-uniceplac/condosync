'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ShieldCheck,
  UserCircle2,
  Vote,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { LogoCondoSync } from '@/components/condo/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCondo } from '@/lib/condo-store';
import { cn } from '@/lib/utils';
const NAVEGACAO = [
  { titulo: 'Visão Geral', url: '/painel', icone: LayoutDashboard },
  { titulo: 'Reservas', url: '/reservas', icone: CalendarDays },
  { titulo: 'Portaria', url: '/portaria', icone: ShieldCheck },
  { titulo: 'Meus Visitantes', url: '/visitantes', icone: DoorOpen },
  { titulo: 'Mural de Avisos', url: '/avisos', icone: Megaphone },
  { titulo: 'Chamados', url: '/chamados', icone: ClipboardList },
  { titulo: 'Enquetes', url: '/enquetes', icone: Vote },
  { titulo: 'Administração', url: '/admin', icone: UserCheck },
];
export function AppLayout({ titulo, subtitulo, children }) {
  const { estado, usuario } = useCondo();
  const router = useRouter();
  const caminho = usePathname();
  const naoLidos = estado.avisos.filter((a) => !a.lido).length;
  if (!estado.sessao || !usuario) return null;
  // Itens só aparecem para quem tem acesso (mesma regra do middleware/RBAC)
  const perfil = estado.sessao.perfil;
  const itens = NAVEGACAO.filter((item) => {
    if (perfil === 'admin') return item.url === '/admin';
    if (item.url === '/portaria') return perfil !== 'morador';
    if (item.url === '/visitantes') return perfil === 'morador';
    if (item.url === '/admin') return perfil === 'sindico';
    return true;
  });
  const encerrar = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Sessão encerrada com sucesso');
    router.replace('/login');
    router.refresh();
  };
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-sidebar px-4 py-6 lg:flex">
        <LogoCondoSync tom="claro" className="px-2" />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {itens.map((item) => {
            const ativo = caminho === item.url;
            return (
              <Link
                key={item.url}
                href={item.url}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  ativo
                    ? 'bg-primary text-primary-foreground shadow-[var(--shadow-lift)]'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )}
              >
                <item.icone className="h-4.5 w-4.5" />
                {item.titulo}
                {item.url === '/avisos' && naoLidos > 0 && (
                  <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                    {naoLidos}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-xl bg-sidebar-accent p-4 text-sidebar-foreground">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">
            <Building2 className="h-4 w-4" /> Condomínio
          </div>
          <p className="mt-2 text-sm font-semibold">Residencial Vila Aurora</p>
          <p className="text-xs text-sidebar-foreground/60">240 unidades · Blocos A, B e C</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
          <div className="flex flex-wrap items-center gap-4 px-5 py-4">
            <div className="lg:hidden">
              <LogoCondoSync />
            </div>
            <div className="hidden min-w-0 flex-1 lg:block">
              <h1 className="truncate text-lg font-bold text-foreground">{titulo}</h1>
              <p className="truncate text-sm text-muted-foreground">{subtitulo}</p>
            </div>

            <Link
              href="/avisos"
              className="relative rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-primary"
              aria-label="Avisos não lidos"
            >
              <Bell className="h-4.5 w-4.5" />
              {naoLidos > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {naoLidos}
                </span>
              )}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl border border-border px-3 py-1.5 text-left transition-colors hover:border-primary/50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {usuario.iniciais}
                  </span>
                  <span className="hidden sm:block">
                    <span className="block text-sm font-semibold text-foreground">
                      {usuario.nome}
                    </span>
                    <span className="block text-xs text-muted-foreground">{usuario.cargo}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-xl">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold">{usuario.nome}</p>
                  <p className="text-xs font-normal text-muted-foreground">{usuario.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <UserCircle2 className="h-4 w-4" /> Meu perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={encerrar}
                  className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" /> Sair da conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
            {itens.map((item) => (
              <Link
                key={item.url}
                href={item.url}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold',
                  caminho === item.url
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {item.titulo}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-5 py-6">
          <div className="mb-6 lg:hidden">
            <h1 className="text-lg font-bold text-foreground">{titulo}</h1>
            <p className="text-sm text-muted-foreground">{subtitulo}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
