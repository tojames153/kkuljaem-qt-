'use client';

import { AuthProvider } from '@/lib/auth-context';
import { FontSizeProvider } from '@/lib/font-size-context';
import InstallBanner from './InstallBanner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FontSizeProvider>
      <AuthProvider>
        {children}
        <InstallBanner />
      </AuthProvider>
    </FontSizeProvider>
  );
}
