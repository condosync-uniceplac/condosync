/**
 * Página pública /esqueci-senha (pedido do link de recuperação).
 */

import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import EsqueciSenhaForm from '@/components/EsqueciSenhaForm';

// Título (e descrição) da aba do navegador.
export const metadata = { title: 'Esqueci a senha | CondoSync' };

export default function EsqueciSenhaPage() {
  return (
    <AuthLayout
      titulo="Esqueceu a senha?"
      subtitulo="Informe seu e-mail e enviaremos um link para criar uma nova senha."
    >
      <EsqueciSenhaForm />
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Lembrou a senha?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Voltar ao login
        </Link>
      </p>
    </AuthLayout>
  );
}
