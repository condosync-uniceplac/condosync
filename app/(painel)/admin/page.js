import { AppLayout } from '@/components/condo/AppLayout';

export const metadata = { title: 'Administração | CondoSync' };

// Acesso: SINDICO, ADMIN (ver src/middleware/rbac.js)
export default function AdminPage() {
  return (
    <AppLayout titulo="Administração" subtitulo="Gestão do condomínio">
      <p>
        Gestão do condomínio, aprovação de cadastros e cadastros de espaços — em desenvolvimento.
      </p>
    </AppLayout>
  );
}
