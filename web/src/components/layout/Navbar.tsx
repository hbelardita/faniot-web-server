'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Gauge, Sprout } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Gauge },
  { href: '/control', label: 'Control', icon: Sprout },
];

interface NavbarProps {
  isOnline: boolean;
}

export default function Navbar({ isOnline }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-[var(--z-navbar)] backdrop-blur-xl border-b transition-colors duration-500"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="p-2 rounded-xl transition-all duration-300 group-hover:scale-105"
            style={{ background: 'var(--emerald-glow)', color: 'var(--emerald-500)' }}
          >
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Faniot<span style={{ color: 'var(--emerald-500)' }}>Cloud</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: isActive ? 'var(--surface-overlay)' : 'transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Theme Toggle + Status badge */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div
            className="flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-500"
            style={{
              background: isOnline ? 'var(--emerald-glow)' : 'rgba(239, 68, 68, 0.1)',
              color: isOnline ? 'var(--emerald-500)' : 'var(--status-offline)',
            }}
            aria-live="polite"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: isOnline ? 'var(--status-online)' : 'var(--status-offline)',
                boxShadow: isOnline
                  ? `0 0 8px var(--status-online-glow)`
                  : `0 0 8px var(--status-offline-glow)`,
                animation: isOnline ? 'pulse-glow 2s ease-in-out infinite' : 'none',
              }}
            />
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
