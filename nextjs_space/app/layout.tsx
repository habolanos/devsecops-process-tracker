import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/lib/i18n-context';
import { ToastProvider } from '@/components/toast-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { GlobalCommandPalette } from '@/components/global-command-palette';
import { ThemeProvider } from '@/components/theme-provider';
import GlobalProgressIndicator from '@/components/global-progress-indicator';

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
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <I18nProvider>
              <GlobalProgressIndicator />
              {children}
              <ToastProvider />
              <GlobalCommandPalette />
            </I18nProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
