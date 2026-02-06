"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
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

export interface PoolReserves {
  usdc: bigint;
  usdt: bigint;
  sui: bigint;
  totalLiquidity: number;
}

interface AmpereContextType {
  // SDK instance
  sdk: OrbitalSdk | null;
  client: SuiClient | null;
  
  // Balances
  balances: TokenBalance[];
  poolReserves: PoolReserves | null;
  loading: boolean;
  
  // Configuration status
  isConfigured: boolean;
  
  // Actions
  refreshBalances: () => Promise<void>;
  getPoolReserves: () => Promise<void>;
  executeSwap: (params: {
    coinInSymbol: TokenSymbol;
    amount: string;
    route: SwapRoute;
  }) => Promise<{ success: boolean; error?: string; digest?: string }>;
  addLiquidity: (params: {
    amountA: string;
    amountB: string;
    amountC: string;
  }) => Promise<{ success: boolean; error?: string; digest?: string }>;
  removeLiquidity: (params: {
    lpAmount: string;
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
  const [poolReserves, setPoolReserves] = useState<PoolReserves | null>(null);
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

      console.log('🌐 Connected to Sui network:', rpcUrl);
      console.log('📦 Package ID:', AMPERE_CONFIG.packageId);
      console.log('🏊 Pool ID:', AMPERE_CONFIG.poolId);

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

  // Fetch balances and pool reserves when account changes
  useEffect(() => {
    if (wallet.connected && wallet.account && client) {
      refreshBalances();
      getPoolReserves();
    } else {
      setBalances([]);
    }
  }, [wallet.connected, wallet.account, client]);

  // Fetch pool reserves on mount (even without wallet)
  useEffect(() => {
    if (client && isConfigured) {
      getPoolReserves();
    }
  }, [client, isConfigured]);

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

    console.log('🔄 Starting swap:', params);
    console.log('📍 Pool ID:', AMPERE_CONFIG.poolId);
    console.log('📍 Package ID:', AMPERE_CONFIG.packageId);

    try {
      const { coinInSymbol, amount, route } = params;
      const typeArgs = getPool3TypeArgs();
      
      console.log('🎯 Type arguments:', typeArgs);
      
      // Get coin type index
      let coinTypeIndex = 0;
      if (coinInSymbol === 'USDT') coinTypeIndex = 1;
      else if (coinInSymbol === 'SUI') coinTypeIndex = 2;
      
      const coinType = typeArgs[coinTypeIndex];
      console.log(`💰 Looking for ${coinInSymbol} coins with type:`, coinType);

      // Create swap transaction using TransactionBlock (compatible with Suiet wallet)
      console.log('🔨 Building transaction...');
      const tx = new TransactionBlock();
      
      // Map route to function name
      const routeFunctions: Record<SwapRoute, string> = {
        'AtoB': 'swap_a_for_b_exact_in',
        'BtoA': 'swap_b_for_a_exact_in',
        'AtoC': 'swap_a_for_c_exact_in',
        'CtoA': 'swap_c_for_a_exact_in',
        'BtoC': 'swap_b_for_c_exact_in',
        'CtoB': 'swap_c_for_b_exact_in',
      };
      
      let coinInArg;
      
      // Handle SUI swaps differently - split from gas coin
      if (coinInSymbol === 'SUI') {
        console.log('🪙 Splitting SUI from gas coin');
        // Convert amount to base units (SUI has 9 decimals)
        const amountInBaseUnits = Math.floor(parseFloat(amount) * 1_000_000_000);
        [coinInArg] = tx.splitCoins(tx.gas, [amountInBaseUnits]);
      } else {
        // For other tokens, find and use existing coins
        const coins = await client.getCoins({
          owner: wallet.account.address,
          coinType: coinType,
        });

        console.log(`Found ${coins.data.length} ${coinInSymbol} coins`);

        if (coins.data.length === 0) {
          return { success: false, error: `No ${coinInSymbol} coins available` };
        }

        // Use the first coin
        const coinIn = coins.data[0].coinObjectId;
        console.log('🪙 Using coin:', coinIn);
        coinInArg = tx.object(coinIn);
      }
      
      // Perform swap - returns the output coin
      const [outputCoin] = tx.moveCall({
        target: `${AMPERE_CONFIG.packageId}::orbital_pool3::${routeFunctions[route]}`,
        typeArguments: [...typeArgs],
        arguments: [
          tx.object(AMPERE_CONFIG.poolId),
          coinInArg,
        ],
      });
      
      // Transfer the output coin to the sender to avoid "UnusedValueWithoutDrop" error
      tx.transferObjects([outputCoin], wallet.account.address);
      console.log('✅ Added transfer for output coin');

      console.log('✍️ Signing and executing transaction...');

      // Sign and execute with Suiet Wallet Kit using TransactionBlock
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx as any,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      console.log('✅ Transaction executed:', result);

      // Refresh balances after swap
      await refreshBalances();

      return {
        success: true,
        digest: result.digest,
      };
    } catch (error: any) {
      console.error('❌ Swap failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      return {
        success: false,
        error: error.message || 'Swap execution failed',
      };
    }
  }, [sdk, client, wallet, refreshBalances]);

  const addLiquidity = useCallback(async (params: {
    amountA: string;
    amountB: string;
    amountC: string;
  }): Promise<{ success: boolean; error?: string; digest?: string }> => {
    if (!sdk || !client || !wallet.account) {
      return { success: false, error: 'Wallet not connected' };
    }

    console.log('💧 Adding liquidity:', params);

    try {
      const { amountA, amountB, amountC } = params;
      const typeArgs = getPool3TypeArgs();
      
      // Create transaction
      const tx = new TransactionBlock();
      
      // Get or create coins for each token
      const getCoinsForToken = async (
        symbol: TokenSymbol, 
        amount: string, 
        typeIndex: number
      ) => {
        const coinType = typeArgs[typeIndex];
        const metadata = AMPERE_CONFIG.tokens[symbol];
        const amountInBaseUnits = Math.floor(parseFloat(amount) * Math.pow(10, metadata.decimals));
        
        // Handle SUI differently
        if (symbol === 'SUI') {
          const [coinArg] = tx.splitCoins(tx.gas, [amountInBaseUnits]);
          return coinArg;
        }
        
        // For other tokens, get coins
        const coins = await client.getCoins({
          owner: wallet.account!.address,
          coinType: coinType,
        });
        
        if (coins.data.length === 0) {
          throw new Error(`No ${symbol} coins available`);
        }
        
        // Use first coin
        return tx.object(coins.data[0].coinObjectId);
      };
      
      // Get coin arguments
      const coinAArg = await getCoinsForToken('USDC', amountA, 0);
      const coinBArg = await getCoinsForToken('USDT', amountB, 1);
      const coinCArg = await getCoinsForToken('SUI', amountC, 2);
      
      // Add liquidity - returns LP coin
      const [lpCoin] = tx.moveCall({
        target: `${AMPERE_CONFIG.packageId}::orbital_pool3::add_liquidity`,
        typeArguments: [...typeArgs],
        arguments: [
          tx.object(AMPERE_CONFIG.poolId),
          coinAArg,
          coinBArg,
          coinCArg,
        ],
      });
      
      // Transfer LP coin to sender
      tx.transferObjects([lpCoin], wallet.account.address);
      
      console.log('✍️ Signing and executing add liquidity...');
      
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx as any,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });
      
      console.log('✅ Liquidity added:', result);
      
      // Refresh balances
      await refreshBalances();
      
      return {
        success: true,
        digest: result.digest,
      };
    } catch (error: any) {
      console.error('❌ Add liquidity failed:', error);
      return {
        success: false,
        error: error.message || 'Add liquidity failed',
      };
    }
  }, [sdk, client, wallet, refreshBalances]);

  const removeLiquidity = useCallback(async (params: {
    lpAmount: string;
  }): Promise<{ success: boolean; error?: string; digest?: string }> => {
    if (!sdk || !client || !wallet.account) {
      return { success: false, error: 'Wallet not connected' };
    }

    console.log('💧 Removing liquidity:', params);

    try {
      const { lpAmount } = params;
      const typeArgs = getPool3TypeArgs();
      
      // Get LP tokens
      const lpCoinType = typeArgs[3];
      const lpCoins = await client.getCoins({
        owner: wallet.account.address,
        coinType: lpCoinType,
      });
      
      if (lpCoins.data.length === 0) {
        return { success: false, error: 'No LP tokens available' };
      }
      
      // Create transaction
      const tx = new TransactionBlock();
      
      // Use the first LP coin
      const lpCoinArg = tx.object(lpCoins.data[0].coinObjectId);
      
      // Remove liquidity - returns [coinA, coinB, coinC]
      const [coinA, coinB, coinC] = tx.moveCall({
        target: `${AMPERE_CONFIG.packageId}::orbital_pool3::remove_liquidity`,
        typeArguments: [...typeArgs],
        arguments: [
          tx.object(AMPERE_CONFIG.poolId),
          lpCoinArg,
        ],
      });
      
      // Transfer returned coins to sender
      tx.transferObjects([coinA, coinB, coinC], wallet.account.address);
      
      console.log('✍️ Signing and executing remove liquidity...');
      
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx as any,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });
      
      console.log('✅ Liquidity removed:', result);
      
      // Refresh balances
      await refreshBalances();
      
      return {
        success: true,
        digest: result.digest,
      };
    } catch (error: any) {
      console.error('❌ Remove liquidity failed:', error);
      return {
        success: false,
        error: error.message || 'Remove liquidity failed',
      };
    }
  }, [sdk, client, wallet, refreshBalances]);

  const getPoolReserves = useCallback(async () => {
    if (!client) return;

    try {
      // Get pool object
      const poolObject = await client.getObject({
        id: AMPERE_CONFIG.poolId,
        options: { showContent: true },
      });

      if (poolObject.data?.content?.dataType === 'moveObject') {
        const fields = poolObject.data.content.fields as any;
        
        // Calculate total reserves from ticks
        if (fields.ticks && Array.isArray(fields.ticks)) {
          const totalA = fields.ticks.reduce((sum: bigint, t: any) => {
            const tf = t.fields || t;
            return sum + BigInt(tf.balance_a || 0);
          }, BigInt(0));
          
          const totalB = fields.ticks.reduce((sum: bigint, t: any) => {
            const tf = t.fields || t;
            return sum + BigInt(tf.balance_b || 0);
          }, BigInt(0));
          
          const totalC = fields.ticks.reduce((sum: bigint, t: any) => {
            const tf = t.fields || t;
            return sum + BigInt(tf.balance_c || 0);
          }, BigInt(0));

          // Calculate total liquidity in USD (assuming USDC and USDT are $1)
          const totalLiquidity = 
            formatBalance(totalA, 'USDC') + 
            formatBalance(totalB, 'USDT') + 
            formatBalance(totalC, 'SUI') * 2.5; // Assuming SUI price ~$2.5

          setPoolReserves({
            usdc: totalA,
            usdt: totalB,
            sui: totalC,
            totalLiquidity,
          });

          console.log('🏊 Pool Reserves:', {
            USDC: formatBalance(totalA, 'USDC'),
            USDT: formatBalance(totalB, 'USDT'),
            SUI: formatBalance(totalC, 'SUI'),
            totalLiquidity,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch pool reserves:', error);
    }
  }, [client]);

  const value: AmpereContextType = {
    isConfigured,
    sdk,
    client,
    balances,
    poolReserves,
    loading,
    refreshBalances,
    getPoolReserves,
    executeSwap,
    addLiquidity,
    removeLiquidity,
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
