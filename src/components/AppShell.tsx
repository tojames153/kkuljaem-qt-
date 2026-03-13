'use client';

import Header from './Header';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm-white">
      <Header />
      <main className="max-w-lg mx-auto pb-20 px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
