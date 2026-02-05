"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useWallet } from "@suiet/wallet-kit";
import { useAmpere } from "@/contexts/ampere-context";
import { AMPERE_CONFIG, type TokenSymbol } from "@/lib/ampere-config";
import type { SwapRoute } from "@/ampere-protocol/src/sdk/types";
import { useToast } from "@/hooks/use-toast";

interface TradePanelProps {
  pair: string;
  isInverted?: boolean;
}

// Helper to determine swap route based on pair and direction
function getSwapRoute(fromToken: TokenSymbol, toToken: TokenSymbol): SwapRoute {
  if (fromToken === 'USDC' && toToken === 'USDT') return 'AtoB';
  if (fromToken === 'USDT' && toToken === 'USDC') return 'BtoA';
  if (fromToken === 'USDC' && toToken === 'SUI') return 'AtoC';
  if (fromToken === 'SUI' && toToken === 'USDC') return 'CtoA';
  if (fromToken === 'USDT' && toToken === 'SUI') return 'BtoC';
  if (fromToken === 'SUI' && toToken === 'USDT') return 'CtoB';
  throw new Error(`Invalid swap route: ${fromToken} to ${toToken}`);
}

export function TradePanel({ pair, isInverted = false }: TradePanelProps) {
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [buySlippage, setBuySlippage] = useState([0.5]);
  const [sellSlippage, setSellSlippage] = useState([0.5]);
  const [buyLoading, setBuyLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);

  const { connected } = useWallet();
  const { executeSwap, balances, isConfigured } = useAmpere();
  const { toast } = useToast();

  // Parse pair to get token symbols
  const [tokenAName, tokenBName] = pair.split("/");
  
  // Map display names to token symbols (USDC, USDT, SUI)
  const getTokenSymbol = (name: string): TokenSymbol => {
    if (name === AMPERE_CONFIG.tokens.USDC.symbol) return 'USDC';
    if (name === AMPERE_CONFIG.tokens.USDT.symbol) return 'USDT';
    if (name === AMPERE_CONFIG.tokens.SUI.symbol) return 'SUI';
    return 'USDC'; // fallback
  };

  const tokenA = getTokenSymbol(tokenAName);
  const tokenB = getTokenSymbol(tokenBName);

  // Get balances for display
  const tokenABalance = useMemo(() => {
    const bal = balances.find(b => b.symbol === tokenA);
    return bal ? bal.formatted : 0;
  }, [balances, tokenA]);

  const tokenBBalance = useMemo(() => {
    const bal = balances.find(b => b.symbol === tokenB);
    return bal ? bal.formatted : 0;
  }, [balances, tokenB]);

  const handleBuy = async () => {
    if (!isConfigured) {
      toast({
        title: "Configuration required",
        description: "Please set up your .env.local file with deployed contract addresses",
        variant: "destructive",
      });
      return;
    }

    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to trade",
        variant: "destructive",
      });
      return;
    }

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setBuyLoading(true);
    try {
      // Buy tokenA with tokenB means swap tokenB -> tokenA
      const route = getSwapRoute(tokenB, tokenA);
      
      const result = await executeSwap({
        coinInSymbol: tokenB,
        amount: buyAmount,
        route,
      });

      if (result.success) {
        toast({
          title: "Swap successful!",
          description: `Bought ${tokenAName} with ${tokenBName}`,
        });
        setBuyAmount("");
      } else {
        toast({
          title: "Swap failed",
          description: result.error || "Transaction failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Swap failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setBuyLoading(false);
    }
  };

  const handleSell = async () => {
    if (!isConfigured) {
      toast({
        title: "Configuration required",
        description: "Please set up your .env.local file with deployed contract addresses",
        variant: "destructive",
      });
      return;
    }

    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to trade",
        variant: "destructive",
      });
      return;
    }

    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setSellLoading(true);
    try {
      // Sell tokenA for tokenB means swap tokenA -> tokenB
      const route = getSwapRoute(tokenA, tokenB);
      
      const result = await executeSwap({
        coinInSymbol: tokenA,
        amount: sellAmount,
        route,
      });

      if (result.success) {
        toast({
          title: "Swap successful!",
          description: `Sold ${tokenAName} for ${tokenBName}`,
        });
        setSellAmount("");
      } else {
        toast({
          title: "Swap failed",
          description: result.error || "Transaction failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Swap failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSellLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Buy Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h3 className="mb-4 text-sm font-semibold text-success">
          Buy {tokenAName}
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Amount ({tokenBName})</Label>
              <span className="text-xs text-muted-foreground">
                Balance: {tokenBBalance.toFixed(6)}
              </span>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="font-mono bg-input border-border"
              disabled={!connected || buyLoading}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Slippage Tolerance</Label>
              <span className="text-xs font-mono text-foreground">{buySlippage[0]}%</span>
            </div>
            <Slider
              value={buySlippage}
              onValueChange={setBuySlippage}
              max={5}
              min={0.1}
              step={0.1}
              className="w-full"
              disabled={!connected || buyLoading}
            />
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Est. Received</span>
              <span className="font-mono text-foreground">
                {buyAmount ? (parseFloat(buyAmount) * 0.98).toFixed(4) : "0.00"} {tokenAName}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Price Impact</span>
              <span className="font-mono text-success">~0.01%</span>
            </div>
          </div>
          
          <Button 
            className="w-full bg-success text-success-foreground hover:bg-success/90"
            onClick={handleBuy}
            disabled={!connected || buyLoading || !buyAmount || !isConfigured}
          >
            {buyLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Swapping...
              </>
            ) : !isConfigured ? (
              "Setup Required"
            ) : !connected ? (
              "Connect Wallet"
            ) : (
              `Buy ${tokenAName}`
            )}
          </Button>
        </div>
      </motion.div>

      {/* Sell Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h3 className="mb-4 text-sm font-semibold text-destructive">
          Sell {tokenAName}
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Amount ({tokenAName})</Label>
              <span className="text-xs text-muted-foreground">
                Balance: {tokenABalance.toFixed(6)}
              </span>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="font-mono bg-input border-border"
              disabled={!connected || sellLoading}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Slippage Tolerance</Label>
              <span className="text-xs font-mono text-foreground">{sellSlippage[0]}%</span>
            </div>
            <Slider
              value={sellSlippage}
              onValueChange={setSellSlippage}
              max={5}
              min={0.1}
              step={0.1}
              className="w-full"
              disabled={!connected || sellLoading}
            />
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Est. Received</span>
              <span className="font-mono text-foreground">
                {sellAmount ? (parseFloat(sellAmount) * 1.02).toFixed(4) : "0.00"} {tokenBName}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Price Impact</span>
              <span className="font-mono text-destructive">~0.05%</span>
            </div>
          </div>
          
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleSell}
            disabled={!connected || sellLoading || !sellAmount || !isConfigured}
          >
            {sellLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Swapping...
              </>
            ) : !isConfigured ? (
              "Setup Required"
            ) : !connected ? (
              "Connect Wallet"
            ) : (
              `Sell ${tokenAName}`
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
