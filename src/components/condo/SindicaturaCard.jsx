'use client';

import { Crown, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SELECT_CLASSE } from '@/components/condo/campos-visitante';
import { Button } from '@/components/ui/button';
import { lerResposta, enviarJson } from '@/lib/apiClient';

/**
 * Síndico do condomínio (RN.04/RN.06 revisadas): o administrador designa o síndico
 * e o síndico atual pode transferir a função para o morador eleito.
 */
export function SindicaturaCard() {
  const [dados, setDados] = useState(null);
  const [escolhido, setEscolhido] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setDados(await lerResposta(await fetch('/api/admin/sindicatura', { cache: 'no-store' })));
    } catch (e) {
      toast.error(e.message);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!dados) return null;
  const ehAdmin = dados.perfil === 'ADMIN';
  const candidato = dados.candidatos.find((c) => String(c.vinculoId) === escolhido);

  const confirmar = async () => {
    if (!candidato) {
      toast.error('Escolha o morador que vai assumir como síndico.');
      return;
    }
    const aviso = ehAdmin
      ? `Designar ${candidato.nome} como síndico?`
      : `Transferir a função de síndico para ${candidato.nome}? Você volta a ser morador e precisará entrar de novo.`;
    if (!window.confirm(aviso)) return;
    setEnviando(true);
    try {
      const r = await enviarJson('/api/admin/sindicatura', 'POST', {
        vinculoId: candidato.vinculoId,
      });
      toast.success(`${r.sindico} agora é o síndico do condomínio.`);
      if (r.voceSaiu) {
        window.location.href = '/api/auth/sessao-expirada';
        return;
      }
      setEscolhido('');
      await carregar();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="mb-5 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Síndico do condomínio</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {dados.sindico
          ? `Atual: ${dados.sindico.nome}${dados.sindico.unidade ? ` (${dados.sindico.unidade})` : ''}`
          : 'O condomínio ainda não tem síndico designado.'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {ehAdmin
          ? 'Escolha o morador eleito. Quem deixa a função volta a ser morador da sua unidade.'
          : 'Ao fim do mandato, transfira a função para o morador eleito.'}
      </p>

      {dados.candidatos.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Nenhum morador ativo ainda. O síndico é escolhido entre os moradores com cadastro
          aprovado.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            aria-label="Morador que vai assumir como síndico"
            value={escolhido}
            onChange={(e) => setEscolhido(e.target.value)}
            className={`${SELECT_CLASSE} max-w-md`}
          >
            <option value="">Selecione o morador</option>
            {dados.candidatos.map((c) => (
              <option key={c.vinculoId} value={c.vinculoId}>
                {c.nome} — {c.unidade}
              </option>
            ))}
          </select>
          <Button className="rounded-xl" onClick={confirmar} disabled={enviando}>
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            {ehAdmin ? 'Designar síndico' : 'Transferir função'}
          </Button>
        </div>
      )}
    </section>
  );
}
