'use client';

import Navbar from './Navbar';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
  isOnline: boolean;
}

export default function AppShell({ children, isOnline }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface-base)' }}>
      <Navbar isOnline={isOnline} />
      <main className="flex-1 px-4 md:px-8 py-8 md:py-12 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
