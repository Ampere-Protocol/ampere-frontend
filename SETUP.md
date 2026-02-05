# Ampere Frontend - Quick Start Guide

## Prerequisites

1. **Phantom Wallet**: Install the [Phantom browser extension](https://phantom.com/)
2. **SUI Testnet**: Switch your Phantom wallet to SUI Testnet
3. **Test Tokens**: Get SUI testnet tokens from the [SUI faucet](https://discord.gg/sui)

## Setup Steps

### 1. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your deployed contract addresses from `ampere-protocol`:

```env
NEXT_PUBLIC_PACKAGE_ID=0x<your_package_id>
NEXT_PUBLIC_POOL_ID=0x<your_pool_id>
NEXT_PUBLIC_POOL_SHARED_VERSION=1
NEXT_PUBLIC_TYPE_A=0x<package_id>::usdc::USDC
NEXT_PUBLIC_TYPE_B=0x<package_id>::usdt::USDT
NEXT_PUBLIC_TYPE_C=0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI
NEXT_PUBLIC_TYPE_LP=0x<package_id>::lp::LP
```

**To get these values:**
1. Check your `ampere-protocol/.env` file
2. Or run `cd ampere-protocol && cat .env`

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Using the DEX

### Connect Wallet

1. Click **"Connect Wallet"** in the top-right navigation
2. Approve the connection in Phantom
3. Your address will appear in the navigation bar

### Switch Networks

1. Click the network dropdown (Testnet/Mainnet)
2. Select your desired network
3. The RPC endpoint will update automatically

### View Balances

1. Navigate to a trading pair (e.g., click on a pair from the landing page)
2. Your token balances will load automatically in the **Balance** tab
3. Click **Refresh** to update balances manually

### Execute a Swap

**To Buy (e.g., buy USDC with USDT):**
1. Go to the Buy panel (green section)
2. Enter the amount of USDT you want to spend
3. Adjust slippage tolerance if needed
4. Click **"Buy USDC"**
5. Approve the transaction in Phantom
6. Wait for confirmation
7. Your balances will refresh automatically

**To Sell (e.g., sell USDC for USDT):**
1. Go to the Sell panel (red section)
2. Enter the amount of USDC you want to sell
3. Adjust slippage tolerance if needed
4. Click **"Sell USDC"**
5. Approve the transaction in Phantom
6. Wait for confirmation
7. Your balances will refresh automatically

### Invert Trading Pair

Click the **swap icon** (⇄) next to the pair name to invert the trading pair:
- **USDC/USDT** becomes **USDT/USDC**
- Buy/Sell directions reverse accordingly
- Swap routes are automatically adjusted

## Troubleshooting

### Wallet Won't Connect

- Make sure Phantom extension is installed and unlocked
- Check that you're on the correct network (Testnet/Mainnet)
- Try refreshing the page

### Can't See Balances

- Ensure your wallet is connected
- Verify you have tokens in your wallet
- Check that environment variables are correctly set
- Open browser console (F12) to check for errors

### Swap Fails

**Common issues:**
- **Insufficient balance**: You don't have enough of the input token
- **Empty pool**: The pool has no liquidity
- **Wrong network**: Your wallet is on mainnet but app is configured for testnet
- **Invalid configuration**: Check `.env.local` values match your deployment

**To debug:**
1. Open browser console (F12)
2. Look for error messages
3. Verify pool ID and package ID are correct
4. Check that type arguments match your deployed tokens

### Environment Variables Not Working

- Make sure you created `.env.local` (not just `.env`)
- Restart the dev server after changing environment variables
- Variables must start with `NEXT_PUBLIC_` to be accessible in browser

## Development

### Project Structure

```
ampere-frontend/
├── ampere-protocol/          # SDK submodule
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Landing page
├── components/
│   ├── account-panel.tsx    # Balance display
│   ├── trade-panel.tsx      # Buy/Sell interface
│   ├── trading-terminal.tsx # Main trading UI
│   └── navigation.tsx       # Wallet connection UI
├── contexts/
│   ├── wallet-context.tsx   # Phantom wallet state
│   └── ampere-context.tsx   # SDK & blockchain integration
└── lib/
    ├── ampere-config.ts     # Protocol configuration
    └── wallet-config.ts     # RPC configuration
```

### Key Files to Modify

**Token Configuration**: [lib/ampere-config.ts](lib/ampere-config.ts)
- Update token symbols, names, and decimals
- Modify type arguments for your deployment

**RPC Endpoints**: [lib/wallet-config.ts](lib/wallet-config.ts)
- Configure custom RPC URLs
- Set default network (testnet/mainnet)

**UI Components**: [components/](components/)
- Customize trading interface
- Modify balance display
- Add new features

## Testing Checklist

- [ ] Wallet connects successfully
- [ ] Network switching works
- [ ] Balances display correctly for all tokens (A, B, C)
- [ ] Buy transaction executes
- [ ] Sell transaction executes
- [ ] Balances refresh after swap
- [ ] Pair inversion works correctly
- [ ] Error messages display for failed transactions
- [ ] Loading states show during transactions

## Next Steps

1. **Get Test Tokens**: 
   - Use the faucet in `ampere-protocol` to mint test tokens
   - Run: `cd ampere-protocol && bun run examples/mint-tokens.ts`

2. **Add Liquidity**:
   - Add liquidity to your pool using the SDK scripts
   - Run: `cd ampere-protocol && bun run scripts/add-liquidity.ts`

3. **Test Swaps**:
   - Try small swaps first
   - Monitor blockchain for transaction confirmations
   - Check pool reserves using `check-balances.ts`

## Additional Resources

- [Phantom SUI Documentation](https://docs.phantom.com/sui)
- [SUI Documentation](https://docs.sui.io/)
- [Ampere SDK Integration Guide](SDK_INTEGRATION.md)
- [Wallet Integration Guide](WALLET_INTEGRATION.md)

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify environment configuration
3. Review deployment addresses in `ampere-protocol/.env`
4. Ensure pool has liquidity
