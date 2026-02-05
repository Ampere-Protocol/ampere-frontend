# SUI Phantom Wallet Integration

This project now includes Phantom wallet integration for the SUI blockchain.

## Features

- ✅ Phantom wallet detection and connection
- ✅ Network switching (Testnet/Mainnet)
- ✅ Wallet state management with React Context
- ✅ Configurable RPC endpoints
- ✅ Event listeners for wallet events (connect, disconnect, account changed)

## Configuration

### RPC Endpoints

The wallet is configured to use SUI Testnet by default. You can modify the RPC configuration in `lib/wallet-config.ts`:

```typescript
export const WALLET_CONFIG = {
  // SUI Testnet RPC endpoint
  testnetRpcUrl: 'https://fullnode.testnet.sui.io:443',
  
  // SUI Mainnet RPC endpoint
  mainnetRpcUrl: 'https://fullnode.mainnet.sui.io:443',
  
  // Default network
  defaultNetwork: 'testnet',
};
```

### Custom RPC Endpoints

To use a custom RPC endpoint, update the `testnetRpcUrl` or `mainnetRpcUrl` in the configuration file.

## Usage

### Basic Wallet Connection

The wallet functionality is already integrated into the navigation component. Users can:

1. Click "Connect Wallet" to connect their Phantom wallet
2. View their connected address
3. Switch between Testnet and Mainnet
4. Disconnect their wallet

### Using the Wallet Context in Your Components

```typescript
import { useWallet } from '@/contexts/wallet-context';

function YourComponent() {
  const { 
    connected, 
    account, 
    provider, 
    network, 
    rpcUrl,
    connect, 
    disconnect 
  } = useWallet();

  // Your component logic
}
```

### Wallet Context Properties

- `connected`: Boolean indicating if wallet is connected
- `connecting`: Boolean indicating connection in progress
- `account`: The connected account object (address, publicKey)
- `provider`: The Phantom provider instance
- `network`: Current network ('testnet' | 'mainnet')
- `rpcUrl`: Current RPC URL based on selected network
- `connect()`: Function to connect wallet
- `disconnect()`: Function to disconnect wallet
- `setNetwork(network)`: Function to switch networks

### Sign and Execute Transactions

```typescript
const { provider } = useWallet();

// Example transaction
const transaction = /* your transaction block */;

const result = await provider?.signAndExecuteTransactionBlock({
  transactionBlock: transaction,
  options: {
    requestType: 'WaitForEffectsCert',
  },
});
```

### Sign Messages

```typescript
const { provider } = useWallet();

const message = new TextEncoder().encode('Hello Ampere!');

const signature = await provider?.signMessage({
  message: message,
});
```

## Files Added

- `types/phantom.d.ts` - TypeScript type definitions for Phantom wallet
- `lib/wallet-config.ts` - RPC configuration for SUI networks
- `contexts/wallet-context.tsx` - React context for wallet state management
- `components/navigation.tsx` - Updated with wallet connection UI

## Dependencies

- `@mysten/sui.js` - SUI blockchain SDK

## Resources

- [Phantom SUI Documentation](https://docs.phantom.com/sui)
- [SUI Documentation](https://docs.sui.io/)
