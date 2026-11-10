/**
 * Layout raiz do site: carrega os estilos globais e define o idioma da página (pt-BR).
 */

import './globals.css';
import './condo.css';

// Título (e descrição) da aba do navegador.
export const metadata = {
  title: 'CondoSync',
  description: 'Gestão condominial: reservas, portaria, avisos, chamados e enquetes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
