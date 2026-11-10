'use client';

/**
 * Tela de Administração (síndico/admin), com as abas Cadastros pendentes, Moradores,
 * Portaria e Espaços, e o cartão de sindicatura.
 * Componente React de tela (roda no navegador): busca os dados pela API e mostra/edita.
 */

import { Check, UserCheck, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { EspacosAba } from '@/components/condo/EspacosAba';
import { MoradoresAba } from '@/components/condo/MoradoresAba';
import { PortariaAba } from '@/components/condo/PortariaAba';
import { SindicaturaCard } from '@/components/condo/SindicaturaCard';
import { SELECT_CLASSE } from '@/components/condo/campos-visitante';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatTelefone } from '@/lib/masks';
import { lerResposta } from '@/lib/apiClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Nome do perfil exibido em cada cadastro.
const PERFIL_LABEL = { MORADOR: 'Morador', PORTARIA: 'Portaria', SINDICO: 'Síndico' };

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { dateStyle: 'short' });
}

/** RF.03 (versão 2): o síndico aprova ou recusa os cadastros pendentes. */
export default function AprovacoesTela() {
  // Estado da tela: cadastros pendentes, erro, item em processamento e unidade corrigida por cadastro.
  const [cadastros, setCadastros] = useState(null);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(null);
  const [unidades, setUnidades] = useState([]);
  const [unidadeEscolhida, setUnidadeEscolhida] = useState({});

  // Carrega as unidades (para o síndico corrigir a unidade antes de aprovar).
  useEffect(() => {
    fetch('/api/admin/moradores', { cache: 'no-store' })
      .then(lerResposta)
      .then((d) => setUnidades(d.unidades))
      .catch(() => setUnidades([]));
  }, []);

  // Busca os cadastros pendentes.
  const carregar = useCallback(async () => {
    setErro('');
    try {
      const res = await fetch('/api/admin/cadastros', { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Não foi possível carregar os cadastros.');
      setCadastros(body.cadastros);
    } catch (e) {
      setErro(e.message);
      setCadastros([]);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Aprova ou recusa um cadastro (com a unidade corrigida, se escolhida).
  async function decidir(cadastro, acao) {
    if (acao === 'recusar' && !window.confirm(`Recusar o cadastro de ${cadastro.nome}?`)) return;
    setProcessando(cadastro.id);
    try {
      const res = await fetch(`/api/admin/cadastros/${cadastro.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao,
          unidadeId: unidadeEscolhida[cadastro.id] ?? cadastro.unidadeId ?? undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Não foi possível concluir a ação.');
      toast.success(
        acao === 'aprovar' ? `${cadastro.nome} agora tem acesso.` : 'Cadastro recusado.',
      );
      setCadastros((lista) => lista.filter((c) => c.id !== cadastro.id));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessando(null);
    }
  }

  // Desenho da tela (JSX).
  return (
    <AppLayout
      titulo="Administração"
      subtitulo="Síndico, cadastros, moradores, portaria e espaços do condomínio"
    >
      <SindicaturaCard />
      <Tabs defaultValue="cadastros">
        <TabsList className="rounded-xl">
          <TabsTrigger value="cadastros" className="rounded-lg">
            Cadastros pendentes{cadastros?.length ? ` (${cadastros.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="moradores" className="rounded-lg">
            Moradores
          </TabsTrigger>
          <TabsTrigger value="portaria" className="rounded-lg">
            Portaria
          </TabsTrigger>
          <TabsTrigger value="espacos" className="rounded-lg">
            Espaços
          </TabsTrigger>
        </TabsList>
        <TabsContent value="moradores" className="mt-5">
          <MoradoresAba />
        </TabsContent>
        <TabsContent value="portaria" className="mt-5">
          <PortariaAba />
        </TabsContent>
        <TabsContent value="espacos" className="mt-5">
          <EspacosAba />
        </TabsContent>
        <TabsContent value="cadastros" className="mt-5">
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Cadastros pendentes</h2>
              {cadastros && cadastros.length > 0 && (
                <Badge className="rounded-full">{cadastros.length}</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Novos moradores só acessam o CondoSync depois da aprovação. Confira a unidade
              informada e corrija se o morador escolheu o bloco ou o apartamento errado.
            </p>

            {erro && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {erro}
              </p>
            )}

            {cadastros === null && (
              <p className="mt-4 text-sm text-muted-foreground">Carregando cadastros...</p>
            )}

            {cadastros?.length === 0 && !erro && (
              <p className="mt-4 text-sm text-muted-foreground">
                Nenhum cadastro aguardando aprovação.
              </p>
            )}

            {cadastros?.length > 0 && (
              <ul className="mt-4 divide-y divide-border">
                {cadastros.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{c.nome}</span>
                        <Badge variant="outline" className="rounded-full">
                          {PERFIL_LABEL[c.perfil] ?? c.perfil}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {c.email} · {formatTelefone(c.telefone)} · cadastrado em{' '}
                        {formatarData(c.criadoEm)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {c.perfil === 'MORADOR' && (
                        <select
                          aria-label={`Unidade de ${c.nome}`}
                          value={unidadeEscolhida[c.id] ?? c.unidadeId ?? ''}
                          onChange={(e) =>
                            setUnidadeEscolhida({
                              ...unidadeEscolhida,
                              [c.id]: Number(e.target.value),
                            })
                          }
                          className={`${SELECT_CLASSE.replace('w-full', '')} h-9 w-56`}
                        >
                          {unidades.length === 0 && c.unidade && (
                            <option value={c.unidadeId}>{c.unidade}</option>
                          )}
                          {unidades.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.rotulo}
                              {u.id === c.unidadeId ? ' (informada)' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      <Button
                        size="sm"
                        onClick={() => decidir(c, 'aprovar')}
                        disabled={processando === c.id}
                      >
                        <Check className="h-4 w-4" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decidir(c, 'recusar')}
                        disabled={processando === c.id}
                      >
                        <X className="h-4 w-4" /> Recusar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
