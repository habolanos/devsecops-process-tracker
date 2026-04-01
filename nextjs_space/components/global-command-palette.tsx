'use client';

import { CommandPalette } from './command-palette';
import { useI18n } from '@/lib/i18n-context';

export function GlobalCommandPalette() {
  const { language } = useI18n();
  
  return <CommandPalette language={language} />;
}
