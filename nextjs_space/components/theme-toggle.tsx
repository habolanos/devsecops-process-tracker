'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  language?: 'es' | 'en';
}

export function ThemeToggle({ language = 'es' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-lg">
        <div className="w-4 h-4" />
      </button>
    );
  }

  const isDark = theme === 'dark';
  const label = isDark 
    ? (language === 'es' ? 'Modo Claro' : 'Light Mode')
    : (language === 'es' ? 'Modo Oscuro' : 'Dark Mode');

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-accent border border-border rounded-lg transition-colors"
      title={label}
      aria-label={label}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-foreground" />
      ) : (
        <Moon className="w-4 h-4 text-foreground" />
      )}
    </button>
  );
}
