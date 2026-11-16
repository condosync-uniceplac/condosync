'use client';

/**
 * Formulário de login (e-mail ou CPF + senha), com mostrar/ocultar senha e "Lembrar de mim" (RF.06).
 */

import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Estado da tela: erro, envio, senha visível e "Lembrar de mim".
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [lembrar, setLembrar] = useState(false);

  // Envia as credenciais; se der certo, vai para a página pedida (?next) ou para o painel.
  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');
    setEnviando(true);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identificador: form.get('identificador'),
          senha: form.get('senha'),
          lembrar,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErro(body.error || 'Não foi possível entrar.');
        return;
      }
      const next = searchParams.get('next');
      router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/painel');
      router.refresh();
    } catch {
      setErro('Falha de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  const sessaoExpirada = searchParams.get('sessao') === 'expirada';

  // Desenho da tela (JSX).
  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {sessaoExpirada && !erro && (
        <p
          className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground"
          role="status"
        >
          Seu perfil de acesso foi alterado. Entre novamente para continuar.
        </p>
      )}
      {erro && (
        <p
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {erro}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="identificador">E-mail ou CPF</Label>
        <Input
          id="identificador"
          name="identificador"
          placeholder="seu@email.com ou 000.000.000-00"
          maxLength={254}
          autoComplete="username"
          required
          className="h-12 rounded-xl"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="senha">Senha</Label>
          <Link
            href="/esqueci-senha"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="senha"
            name="senha"
            type={verSenha ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="h-12 rounded-xl pr-12"
          />
          <button
            type="button"
            onClick={() => setVerSenha((v) => !v)}
            aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {verSenha ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>
      {/* RF.06: marcado, a sessão dura 30 dias; desmarcado, termina ao fechar o navegador. */}
      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          checked={lembrar}
          onChange={(e) => setLembrar(e.target.checked)}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        Lembrar de mim
      </label>
      <Button
        type="submit"
        disabled={enviando}
        className="h-12 w-full rounded-xl text-base font-bold"
      >
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {enviando ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
