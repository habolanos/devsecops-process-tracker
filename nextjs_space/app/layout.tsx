import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/lib/i18n-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Process Tracker - DevSecOps MVP',
  description: 'Gestiona y ejecuta procesos paso a paso con evidencia completa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className={inter.className}>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
