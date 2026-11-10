'use client';

/**
 * Aba Moradores da Administração: unidades com seus moradores; mover de unidade e remover.
 * Componente React de tela (roda no navegador): busca os dados pela API e mostra/edita.
 */

import { Crown, Home, UserMinus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SELECT_CLASSE } from '@/components/condo/campos-visitante';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { enviarJson, lerResposta } from '@/lib/apiClient';
import { formatTelefone } from '@/lib/masks';

/** RN.04 (revisada): moradores por unidade — trocar de unidade e encerrar vínculo. */
export function MoradoresAba() {
  // Estado: unidades com moradores, busca e filtro "só ocupadas".
  const [unidades, setUnidades] = useState(null);
  const [busca, setBusca] = useState('');
  const [soOcupadas, setSoOcupadas] = useState(true);

  // Busca as unidades e moradores na API.
  const carregar = useCallback(async () => {
    try {
      const d = await lerResposta(await fetch('/api/admin/moradores', { cache: 'no-store' }));
      setUnidades(d.unidades);
    } catch (e) {
      toast.error(e.message);
      setUnidades([]);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Move o morador para outra unidade.
  const mover = async (m, unidadeId) => {
    const destino = unidades.find((u) => String(u.id) === String(unidadeId));
    if (!destino || !window.confirm(`Mover ${m.nome} para ${destino.rotulo}?`)) return;
    try {
      await enviarJson(`/api/admin/moradores/${m.vinculoId}`, 'PATCH', { unidadeId: destino.id });
      toast.success(`${m.nome} agora está em ${destino.rotulo}.`);
      await carregar();
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Remove o morador do condomínio depois de confirmar.
  const remover = async (m) => {
    if (!window.confirm(`Remover ${m.nome} do condomínio? Ele perde o acesso ao CondoSync.`))
      return;
    try {
      await lerResposta(await fetch(`/api/admin/moradores/${m.vinculoId}`, { method: 'DELETE' }));
      toast.success(`${m.nome} foi removido do condomínio.`);
      await carregar();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!unidades) return <p className="text-sm text-muted-foreground">Carregando moradores...</p>;

  const termo = busca.trim().toLowerCase();
  const visiveis = unidades.filter((u) => {
    if (termo)
      return (
        u.rotulo.toLowerCase().includes(termo) ||
        u.moradores.some((m) => m.nome.toLowerCase().includes(termo))
      );
    return !soOcupadas || u.moradores.length > 0;
  });
  const total = unidades.reduce((n, u) => n + u.moradores.length, 0);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Moradores por unidade</h2>
          <p className="text-sm text-muted-foreground">
            {total} morador(es) ativo(s) em {unidades.filter((u) => u.moradores.length).length}{' '}
            unidade(s). Trocar de unidade ou remover encerra a sessão aberta do morador.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={soOcupadas}
              onChange={(e) => setSoOcupadas(e.target.checked)}
            />
            Só unidades com moradores
          </label>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar morador ou unidade"
            className="h-10 w-64 rounded-xl"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visiveis.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma unidade encontrada.</p>
        )}
        {visiveis.map((u) => (
          <article key={u.id} className="rounded-xl border border-border p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Home className="h-4 w-4 text-primary" /> {u.rotulo}
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {u.moradores.length} morador(es)
              </span>
            </h3>
            {u.moradores.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">Sem moradores cadastrados.</p>
            )}
            <ul className="mt-2 space-y-3">
              {u.moradores.map((m) => (
                <li key={m.vinculoId} className="rounded-lg bg-muted/40 p-3">
                  <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    {m.nome}
                    {m.sindico && (
                      <span className="ml-1 inline-flex items-center gap-1 text-xs text-primary">
                        <Crown className="h-3 w-3" /> síndico
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.email} · {formatTelefone(m.telefone)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Mover ${m.nome} para outra unidade`}
                      value=""
                      onChange={(e) => mover(m, e.target.value)}
                      className={`${SELECT_CLASSE.replace('w-full', '')} h-8 w-44 text-xs`}
                    >
                      <option value="">Mover para...</option>
                      {unidades
                        .filter((d) => d.id !== u.id)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.rotulo}
                          </option>
                        ))}
                    </select>
                    {!m.sindico && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-destructive/40 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => remover(m)}
                      >
                        <UserMinus className="h-3.5 w-3.5" /> Remover
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
