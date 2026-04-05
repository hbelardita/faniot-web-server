'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gauge, Sprout } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Gauge },
  { href: '/control', label: 'Control', icon: Sprout },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[var(--z-navbar)] md:hidden backdrop-blur-xl border-t"
      style={{
        background: 'rgba(3, 7, 18, 0.9)',
        borderColor: 'var(--border-default)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200"
              style={{
                color: isActive ? 'var(--emerald-400)' : 'var(--text-muted)',
              }}
            >
              <div
                className="p-1.5 rounded-lg transition-all duration-200"
                style={{
                  background: isActive ? 'var(--emerald-glow)' : 'transparent',
                  boxShadow: isActive ? 'var(--shadow-glow-emerald)' : 'none',
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
