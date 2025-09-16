import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Ticket to Maps',
  description: 'Sélection rapide d\'itinéraires autour de Verzenay'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background text-foreground antialiased',
          'font-sans'
        )}
      >
        {children}
      </body>
    </html>
  );
}
