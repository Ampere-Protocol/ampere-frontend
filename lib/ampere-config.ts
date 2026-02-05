/**
 * Ampere Protocol Configuration
 * Configure your pool and token types here
 */

// TODO: Update these with your actual deployed addresses
export const AMPERE_CONFIG = {
  // Package ID from deployment
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || "0x...",
  
  // Pool ID from deployment
  poolId: process.env.NEXT_PUBLIC_POOL_ID || "0x...",
  
  // Pool shared version (check from deployment)
  poolSharedVersion: process.env.NEXT_PUBLIC_POOL_SHARED_VERSION || "1",
  
  // Token type arguments
  typeArgs: {
    // Token A (e.g., USDC)
    tokenA: process.env.NEXT_PUBLIC_TYPE_A || "0x...::usdc::USDC",
    // Token B (e.g., USDT)
    tokenB: process.env.NEXT_PUBLIC_TYPE_B || "0x...::usdt::USDT",
    // Token C (e.g., SUI)
    tokenC: process.env.NEXT_PUBLIC_TYPE_C || "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
    // LP Token
    tokenLP: process.env.NEXT_PUBLIC_TYPE_LP || "0x...::lp::LP",
  },
  
  // Token metadata
  tokens: {
    USDC: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    USDT: {
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
    SUI: {
      symbol: "SUI",
      name: "SUI",
      decimals: 9,
    },
    LP: {
      symbol: "AMP-LP",
      name: "Ampere LP Token",
      decimals: 9,
    },
  },
} as const;

/**
 * Get type arguments array for Pool3
 */
export function getPool3TypeArgs(): readonly [string, string, string, string] {
  return [
    AMPERE_CONFIG.typeArgs.tokenA,
    AMPERE_CONFIG.typeArgs.tokenB,
    AMPERE_CONFIG.typeArgs.tokenC,
    AMPERE_CONFIG.typeArgs.tokenLP,
  ] as const;
}

/**
 * Token symbol to type mapping
 */
export type TokenSymbol = 'USDC' | 'USDT' | 'SUI' | 'LP';

/**
 * Get token metadata by symbol
 */
export function getTokenMetadata(symbol: TokenSymbol) {
  return AMPERE_CONFIG.tokens[symbol];
}

/**
 * Get coin type by symbol
 */
export function getCoinType(symbol: TokenSymbol): string {
  if (symbol === 'USDC') return AMPERE_CONFIG.typeArgs.tokenA;
  if (symbol === 'USDT') return AMPERE_CONFIG.typeArgs.tokenB;
  if (symbol === 'SUI') return AMPERE_CONFIG.typeArgs.tokenC;
  return AMPERE_CONFIG.typeArgs.tokenLP;
}

/**
 * Format balance according to token decimals
 */
export function formatBalance(balance: bigint, symbol: TokenSymbol): number {
  const metadata = getTokenMetadata(symbol);
  return Number(balance) / Math.pow(10, metadata.decimals);
}
