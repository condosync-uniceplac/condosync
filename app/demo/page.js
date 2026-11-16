/**
 * Página pública /demo — conta rápida de demonstração (QR code da apresentação).
 * Só funciona com o código secreto do link (?c=...) e enquanto a demonstração estiver ligada.
 */

import { AuthLayout } from '@/components/auth/AuthLayout';
import DemoForm from '@/components/DemoForm';
import { codigoValido, demoAtiva } from '@/services/demoService';

// Título da aba do navegador.
export const metadata = { title: 'Demonstração | CondoSync' };
// Lê variáveis de ambiente a cada acesso (liga/desliga sem precisar de novo build).
export const dynamic = 'force-dynamic';

export default async function DemoPage({ searchParams }) {
  const { c } = await searchParams;
  const liberada = demoAtiva() && codigoValido(c);

  if (!liberada) {
    return (
      <AuthLayout
        titulo="Demonstração encerrada"
        subtitulo="Este link de demonstração não está disponível no momento."
      >
        <p className="text-center text-sm text-muted-foreground">
          Obrigado pelo interesse no CondoSync!
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      titulo="Experimente o CondoSync"
      subtitulo="Digite seu nome e entre como morador para testar durante a apresentação."
    >
      <DemoForm codigo={c} />
    </AuthLayout>
  );
}
