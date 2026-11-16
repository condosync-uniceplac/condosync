/**
 * Página pública /cadastro (formulário de cadastro de morador).
 */

import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import RegisterForm from '@/components/RegisterForm';

// Título (e descrição) da aba do navegador.
export const metadata = { title: 'Cadastro | CondoSync' };

export default function CadastroPage() {
  return (
    <AuthLayout
      largo
      titulo="Crie sua conta"
      subtitulo="Depois do cadastro, o síndico confere seus dados e libera o acesso."
    >
      <RegisterForm />
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
