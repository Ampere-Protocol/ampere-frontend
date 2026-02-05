/**
 * Wallet configuration for SUI network
 */

export const WALLET_CONFIG = {
  // SUI Testnet RPC endpoint
  // Replace with your preferred RPC endpoint
  testnetRpcUrl: 'https://fullnode.testnet.sui.io:443',
  
  // SUI Mainnet RPC endpoint (not used by default)
  mainnetRpcUrl: 'https://fullnode.mainnet.sui.io:443',
  
  // Network selection (testnet or mainnet)
  defaultNetwork: 'testnet' as 'testnet' | 'mainnet',
} as const;

/**
 * Get the active RPC URL based on network selection
 */
export function getRpcUrl(network: 'testnet' | 'mainnet' = WALLET_CONFIG.defaultNetwork): string {
  return network === 'testnet' ? WALLET_CONFIG.testnetRpcUrl : WALLET_CONFIG.mainnetRpcUrl;
}
