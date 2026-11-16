'use client';

/**
 * Formulário da conta rápida de demonstração: pede só o nome e entra como morador.
 */

import { Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DemoForm({ codigo }) {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Cria a conta de demonstração e vai para a Visão Geral.
  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const res = await fetch('/api/demo/entrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, nome }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErro(body.fields?.nome || body.error || 'Não foi possível entrar.');
        return;
      }
      router.replace('/painel');
      router.refresh();
    } catch {
      setErro('Falha de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  // Desenho da tela (JSX).
  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {erro && (
        <p
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {erro}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="nome">Seu nome</Label>
        <Input
          id="nome"
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="ex: Ana"
          maxLength={30}
          autoComplete="given-name"
          autoFocus
          className="h-12 rounded-xl"
        />
        <p className="text-xs text-muted-foreground">
          Aparece para o síndico e para a portaria. Use só letras.
        </p>
      </div>
      <Button
        type="submit"
        disabled={enviando || nome.trim().length < 2}
        className="h-12 w-full rounded-xl text-base font-bold"
      >
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {enviando ? 'Entrando...' : 'Entrar na demonstração'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Você entra como morador de um apartamento de teste. Ao continuar, você aceita os Termos de
        Uso e a Política de Privacidade do CondoSync.
      </p>
    </form>
  );
}
