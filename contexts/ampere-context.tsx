"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SuiClient } from '@mysten/sui.js/client';
import { useWallet } from '@suiet/wallet-kit';
import { OrbitalSdk } from '@/ampere-protocol/src/sdk';
import { createSdkConfig } from '@/ampere-protocol/src/sdk/config';
import { AMPERE_CONFIG, getPool3TypeArgs, formatBalance, type TokenSymbol } from '@/lib/ampere-config';
import type { SwapRoute } from '@/ampere-protocol/src/sdk/types';

// Network RPC URLs
const NETWORK_CONFIG = {
  testnet: 'https://fullnode.testnet.sui.io:443',
  mainnet: 'https://fullnode.mainnet.sui.io:443',
};

export interface TokenBalance {
  symbol: TokenSymbol;
  balance: bigint;
  formatted: number;
  coinCount: number;
}

interface AmpereContextType {
  // SDK instance
  sdk: OrbitalSdk | null;
  client: SuiClient | null;
  
  // Balances
  balances: TokenBalance[];
  loading: boolean;
  
  // Configuration status
  isConfigured: boolean;
  
  // Actions
  refreshBalances: () => Promise<void>;
  executeSwap: (params: {
    coinInSymbol: TokenSymbol;
    amount: string;
    route: SwapRoute;
  }) => Promise<{ success: boolean; error?: string; digest?: string }>;
}

const AmpereContext = createContext<AmpereContextType | null>(null);

interface AmpereProviderProps {
  children: ReactNode;
}

export function AmpereProvider({ children }: AmpereProviderProps) {
  const wallet = useWallet();
  const [sdk, setSdk] = useState<OrbitalSdk | null>(null);
  const [client, setClient] = useState<SuiClient | null>(null);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Check if configuration is valid
  const isConfigured = !AMPERE_CONFIG.packageId.includes('...') && 
                       !AMPERE_CONFIG.poolId.includes('...');

  // Initialize SDK and client when wallet connects
  useEffect(() => {
    if (!wallet.connected) {
      setSdk(null);
      setClient(null);
      setBalances([]);
      return;
    }

    // Validate configuration
    if (AMPERE_CONFIG.packageId.includes('...') ||
        AMPERE_CONFIG.poolId.includes('...')) {
      console.error('❌ Ampere Protocol not configured!');
      console.error('Please set up your .env.local file with actual deployment addresses.');
      console.error('See .env.example for the required variables.');
      return;
    }

    try {
      // Use testnet by default
      const rpcUrl = NETWORK_CONFIG.testnet;
      const suiClient = new SuiClient({ url: rpcUrl });
      setClient(suiClient);

      const orbitalSdk = new OrbitalSdk(
        createSdkConfig({
          packageId: AMPERE_CONFIG.packageId,
        })
      );
      setSdk(orbitalSdk);
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
    }
  }, [wallet.connected]);

  // Fetch balances when account changes
  useEffect(() => {
    if (wallet.connected && wallet.account && client) {
      refreshBalances();
    } else {
      setBalances([]);
    }
  }, [wallet.connected, wallet.account, client]);

  const refreshBalances = useCallback(async () => {
    if (!client || !wallet.account) return;

    setLoading(true);
    try {
      const address = wallet.account.address;
      const newBalances: TokenBalance[] = [];

      // Fetch balances for each token
      const tokenSymbols: TokenSymbol[] = ['USDC', 'USDT', 'SUI', 'LP'];
      const typeArgs = getPool3TypeArgs();
      
      for (let i = 0; i < tokenSymbols.length; i++) {
        const symbol = tokenSymbols[i];
        const coinType = typeArgs[i];
        
        // Skip if coinType has placeholder value
        if (coinType.includes('...') || coinType === '0x...') {
          console.warn(`⚠️ Skipping ${symbol} - not configured in .env.local`);
          newBalances.push({
            symbol,
            balance: BigInt(0),
            formatted: 0,
            coinCount: 0,
          });
          continue;
        }
        
        try {
          const coins = await client.getCoins({
            owner: address,
            coinType: coinType,
          });

          const totalBalance = coins.data.reduce(
            (sum: bigint, coin: any) => sum + BigInt(coin.balance),
            BigInt(0)
          );

          newBalances.push({
            symbol,
            balance: totalBalance,
            formatted: formatBalance(totalBalance, symbol),
            coinCount: coins.data.length,
          });
        } catch (error) {
          console.error(`Failed to fetch balance for ${symbol}:`, error);
          newBalances.push({
            symbol,
            balance: BigInt(0),
            formatted: 0,
            coinCount: 0,
          });
        }
      }

      setBalances(newBalances);
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    } finally {
      setLoading(false);
    }
  }, [client, wallet.account]);

  const executeSwap = useCallback(async (params: {
    coinInSymbol: TokenSymbol;
    amount: string;
    route: SwapRoute;
  }): Promise<{ success: boolean; error?: string; digest?: string }> => {
    if (!sdk || !client || !wallet.account) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const { coinInSymbol, amount, route } = params;
      const typeArgs = getPool3TypeArgs();
      
      // Get coin type index
      let coinTypeIndex = 0;
      if (coinInSymbol === 'USDT') coinTypeIndex = 1;
      else if (coinInSymbol === 'SUI') coinTypeIndex = 2;
      
      const coinType = typeArgs[coinTypeIndex];

      // Find coins to use for swap
      const coins = await client.getCoins({
        owner: wallet.account.address,
        coinType: coinType,
      });

      if (coins.data.length === 0) {
        return { success: false, error: `No ${coinInSymbol} coins available` };
      }

      // Use the first coin (TODO: implement coin selection/merging)
      const coinIn = coins.data[0].coinObjectId;

      // Create swap transaction using SDK - swapExactInTx returns the Transaction with swap already added
      const tx = sdk.pool3.swapExactInTx({
        pool: {
          objectId: AMPERE_CONFIG.poolId,
          initialSharedVersion: AMPERE_CONFIG.poolSharedVersion,
          mutable: true,
        },
        coinIn,
        route,
        typeArgs,
      });

      // Sign and execute with Suiet Wallet Kit
      // Note: Using signAndExecuteTransaction (not signAndExecuteTransactionBlock) per Suiet v0.3.x+ API
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });

      console.log('Transaction executed:', result);

      // Refresh balances after swap
      await refreshBalances();

      return {
        success: true,
        digest: result.digest,
      };
    } catch (error: any) {
      console.error('Swap failed:', error);
      return {
        success: false,
        error: error.message || 'Swap execution failed',
      };
    }
  }, [sdk, client, wallet, refreshBalances]);

  const value: AmpereContextType = {
    isConfigured,
    sdk,
    client,
    balances,
    loading,
    refreshBalances,
    executeSwap,
  };

  return (
    <AmpereContext.Provider value={value}>
      {children}
    </AmpereContext.Provider>
  );
}

/**
 * Hook to use the Ampere context
 */
export function useAmpere(): AmpereContextType {
  const context = useContext(AmpereContext);
  
  if (!context) {
    throw new Error('useAmpere must be used within an AmpereProvider');
  }
  
  return context;
}
