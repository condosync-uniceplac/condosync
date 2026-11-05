import AprovacoesTela from '@/components/condo/AprovacoesTela';

export const metadata = { title: 'Administração | CondoSync' };

// Acesso: SINDICO, ADMIN (middleware + src/middleware/rbac.js; a API revalida o perfil)
export default function AdminPage() {
  return <AprovacoesTela />;
}
