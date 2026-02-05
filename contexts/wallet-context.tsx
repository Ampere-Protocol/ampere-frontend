"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PhantomSuiProvider, PhantomSuiAccount } from '@/types/phantom';
import { WALLET_CONFIG, getRpcUrl } from '@/lib/wallet-config';

interface WalletContextType {
  // Wallet state
  connected: boolean;
  connecting: boolean;
  account: PhantomSuiAccount | null;
  provider: PhantomSuiProvider | null;
  
  // Network configuration
  network: 'testnet' | 'mainnet';
  rpcUrl: string;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setNetwork: (network: 'testnet' | 'mainnet') => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

/**
 * Detect and return the Phantom SUI provider
 */
function getPhantomProvider(): PhantomSuiProvider | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if ('phantom' in window) {
    const provider = window.phantom?.sui;
    
    if (provider?.isPhantom) {
      return provider;
    }
  }
  
  return null;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState<PhantomSuiAccount | null>(null);
  const [provider, setProvider] = useState<PhantomSuiProvider | null>(null);
  const [network, setNetworkState] = useState<'testnet' | 'mainnet'>(WALLET_CONFIG.defaultNetwork);
  const [rpcUrl, setRpcUrl] = useState<string>(getRpcUrl(WALLET_CONFIG.defaultNetwork));

  // Initialize provider on mount
  useEffect(() => {
    const phantomProvider = getPhantomProvider();
    setProvider(phantomProvider);
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!provider) return;

    const handleConnect = (publicKey: string) => {
      console.log('Wallet connected:', publicKey);
      // Account will be set via the connect function
    };

    const handleDisconnect = () => {
      console.log('Wallet disconnected');
      setAccount(null);
      setConnected(false);
    };

    const handleAccountChanged = (publicKey: string | null) => {
      console.log('Account changed:', publicKey);
      if (!publicKey) {
        setAccount(null);
        setConnected(false);
      }
      // If account changed to a new one, user needs to reconnect
    };

    provider.on('connect', handleConnect);
    provider.on('disconnect', handleDisconnect);
    provider.on('accountChanged', handleAccountChanged);

    return () => {
      provider.removeListener('connect', handleConnect);
      provider.removeListener('disconnect', handleDisconnect);
      provider.removeListener('accountChanged', handleAccountChanged);
    };
  }, [provider]);

  const connect = useCallback(async () => {
    if (!provider) {
      // Redirect to Phantom website if not installed
      window.open('https://phantom.com/', '_blank');
      return;
    }

    try {
      setConnecting(true);
      const response = await provider.requestAccount();
      setAccount(response);
      setConnected(true);
      console.log('Connected to wallet:', response.address);
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      if (error.code === 4001) {
        // User rejected the request
        console.log('User rejected the connection request');
      }
    } finally {
      setConnecting(false);
    }
  }, [provider]);

  const disconnect = useCallback(async () => {
    if (!provider) return;

    try {
      await provider.disconnect();
      setAccount(null);
      setConnected(false);
      console.log('Disconnected from wallet');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, [provider]);

  const setNetwork = useCallback((newNetwork: 'testnet' | 'mainnet') => {
    setNetworkState(newNetwork);
    setRpcUrl(getRpcUrl(newNetwork));
    console.log(`Network changed to ${newNetwork}:`, getRpcUrl(newNetwork));
  }, []);

  const value: WalletContextType = {
    connected,
    connecting,
    account,
    provider,
    network,
    rpcUrl,
    connect,
    disconnect,
    setNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Hook to use the wallet context
 */
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  
  return context;
}
