import './globals.css';
import './condo.css';

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
