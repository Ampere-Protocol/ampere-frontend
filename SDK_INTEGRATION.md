# Ampere SDK Integration Guide

This guide explains how the Ampere Protocol SDK has been integrated into the frontend.

## Overview

The frontend now connects to your Ampere Protocol smart contracts using:
- **Phantom Wallet** for SUI blockchain authentication
- **Ampere SDK** from the `ampere-protocol` submodule
- **Real-time balance fetching** from the blockchain
- **Swap execution** through the OrbitalPool3 contract

## Configuration

### 1. Set Up Environment Variables

Create a `.env.local` file in the frontend root:

```bash
cp .env.example .env.local
```

Then fill in your deployed contract addresses from the `ampere-protocol` deployment.

### 2. Token Configuration

Update [lib/ampere-config.ts](lib/ampere-config.ts) if needed to match your token symbols and decimals.

## Architecture

### Contexts

1. **WalletContext** ([contexts/wallet-context.tsx](contexts/wallet-context.tsx))
   - Manages Phantom wallet connection
   - Provides wallet state (connected, account, provider)
   - Handles network switching (testnet/mainnet)

2. **AmpereContext** ([contexts/ampere-context.tsx](contexts/ampere-context.tsx))
   - Initializes the Ampere SDK
   - Fetches token balances
   - Executes swaps through the SDK

### Components

1. **AccountPanel** ([components/account-panel.tsx](components/account-panel.tsx))
   - Displays real-time token balances from blockchain
   - Shows balance for tokens A, B, C
   - Refresh button to update balances

2. **TradePanel** ([components/trade-panel.tsx](components/trade-panel.tsx))
   - Buy/Sell interface for trading pairs
   - Executes swaps using the SDK
   - Handles pair inversion (A/B ↔ B/A)
   - Shows user balances and loading states

3. **TradingTerminal** ([components/trading-terminal.tsx](components/trading-terminal.tsx))
   - Main trading interface
   - Passes `isInverted` flag to TradePanel for correct swap routing

## How Swaps Work

### Swap Routing

When a user wants to trade, the system:

1. **Determines the swap route** based on the pair and action:
   - Buy A with B → Swap B to A (route: `BtoA`)
   - Sell A for B → Swap A to B (route: `AtoB`)
   - Handles inversion: if pair is inverted, routes are reversed

2. **Finds available coins**:
   - Queries the blockchain for user's coins of the input token
   - Selects coins to use for the swap

3. **Creates transaction** using SDK:
   ```typescript
   const tx = sdk.pool3.swapExactInTx({
     pool: { objectId, initialSharedVersion, mutable: true },
     coinIn,
     route,
     typeArgs,
   });
   ```

4. **Signs and executes** with Phantom:
   ```typescript
   const result = await provider.signAndExecuteTransactionBlock({
     transactionBlock: tx,
     options: { requestType: 'WaitForEffectsCert' },
   });
   ```

5. **Refreshes balances** after successful swap

### Pair Inversion Handling

The `isInverted` prop ensures correct swap routing:

- **Normal (A/B)**:
  - Buy A = Swap B → A
  - Sell A = Swap A → B

- **Inverted (B/A)**:
  - Buy B = Swap A → B  
  - Sell B = Swap B → A

## Usage Flow

1. **User connects wallet**:
   - Clicks "Connect Wallet" in navigation
   - Phantom prompts for approval
   - Wallet state updates across app

2. **Balances load automatically**:
   - AmpereContext fetches balances on connection
   - AccountPanel displays them
   - TradePanel shows available amounts

3. **User initiates swap**:
   - Enters amount in Buy or Sell panel
   - Clicks buy/sell button
   - Phantom prompts to sign transaction
   - On success, balances refresh automatically

## Token Mapping

The system maps display names to protocol token symbols:

```typescript
USDC (display) → A (protocol)
USDT (display) → B (protocol)  
SUI  (display) → C (protocol)
```

Update `AMPERE_CONFIG.tokens` in [lib/ampere-config.ts](lib/ampere-config.ts) to match your deployment.

## Troubleshooting

### "Wallet not connected"
- Make sure Phantom is installed
- Click "Connect Wallet" in the navigation
- Approve the connection in Phantom

### "No [TOKEN] coins available"
- Your wallet has no balance for that token
- Get test tokens on testnet or add liquidity

### Swap fails
- Check you have enough balance
- Ensure pool has liquidity
- Verify environment variables are correct
- Check browser console for detailed errors

## Future Enhancements

- [ ] Coin merging for multi-coin inputs
- [ ] Slippage protection implementation
- [ ] Price quote estimation before swap
- [ ] Transaction history tracking
- [ ] USD value calculation for balances
- [ ] Order book / limit orders

## SDK Documentation

For more details on the SDK, see:
- [ampere-protocol/SDK.md](ampere-protocol/SDK.md)
- [ampere-protocol/README.md](ampere-protocol/README.md)
