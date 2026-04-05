'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar errores de hidratación: solo renderizamos el toggle en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl" style={{ background: 'var(--surface-raised)' }} />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
      style={{
        background: 'var(--surface-raised)',
        color: isDark ? 'var(--amber-400)' : 'var(--blue-500)',
        border: '1px solid var(--border-default)',
        boxShadow: isDark ? 'var(--shadow-glow-amber)' : 'none',
      }}
      title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      aria-label="Cambiar tema visual"
    >
      {isDark ? (
        <Sun className="w-5 h-5 animate-fade-in" />
      ) : (
        <Moon className="w-5 h-5 animate-fade-in" />
      )}
    </button>
  );
}
