/**
 * Página pública /redefinir-senha (nova senha a partir do link recebido por e-mail).
 */

import Link from 'next/link';
import { Suspense } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import RedefinirSenhaForm from '@/components/RedefinirSenhaForm';

// Título (e descrição) da aba do navegador.
export const metadata = { title: 'Redefinir senha | CondoSync' };

export default function RedefinirSenhaPage() {
  return (
    <AuthLayout
      titulo="Crie uma nova senha"
      subtitulo="Escolha uma senha forte que você não use em outros sites."
    >
      {/* Suspense: o formulário lê parâmetros da URL, o que o Next exige dentro de Suspense. */}
      <Suspense>
        <RedefinirSenhaForm />
      </Suspense>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Voltar ao login
        </Link>
      </p>
    </AuthLayout>
  );
}
