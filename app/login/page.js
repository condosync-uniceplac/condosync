/**
 * Página pública /login.
 */

import Link from 'next/link';
import { Suspense } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import LoginForm from '@/components/LoginForm';

// Título (e descrição) da aba do navegador.
export const metadata = { title: 'Entrar | CondoSync' };

export default function LoginPage() {
  return (
    <AuthLayout
      titulo="Bem-vindo de volta"
      subtitulo="Entre com seu e-mail ou CPF para acessar o condomínio."
    >
      {/* Suspense: o formulário lê parâmetros da URL, o que o Next exige dentro de Suspense. */}
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-semibold text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  );
}
