"use client";

import { WalletProvider } from '@suiet/wallet-kit';
import { AmpereProvider } from '@/contexts/ampere-context';
import '@suiet/wallet-kit/style.css';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <AmpereProvider>
        {children}
      </AmpereProvider>
    </WalletProvider>
  );
}
