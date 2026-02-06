"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Minus, Droplets, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAmpere } from "@/contexts/ampere-context";
import { useWallet } from '@suiet/wallet-kit';
import { formatBalance, type TokenSymbol } from "@/lib/ampere-config";

interface LiquidityPanelProps {
  onBack: () => void;
}

export function LiquidityPanel({ onBack }: LiquidityPanelProps) {
  const wallet = useWallet();
  const { balances, loading, addLiquidity, removeLiquidity, isConfigured, refreshBalances } = useAmpere();
  
  // Add Liquidity state
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [amountC, setAmountC] = useState("");
  
  // Remove Liquidity state
  const [lpAmount, setLpAmount] = useState("");
  
  // Transaction state
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getBalance = (symbol: TokenSymbol) => {
    const balance = balances.find(b => b.symbol === symbol);
    return balance ? balance.formatted : 0;
  };

  const handleAddLiquidity = async () => {
    if (!wallet.connected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!isConfigured) {
      setError("Ampere Protocol is not configured. Please check your .env.local file.");
      return;
    }

    const amountANum = parseFloat(amountA);
    const amountBNum = parseFloat(amountB);
    const amountCNum = parseFloat(amountC);

    if (!amountANum || !amountBNum || !amountCNum) {
      setError("Please enter amounts for all three tokens");
      return;
    }

    if (amountANum <= 0 || amountBNum <= 0 || amountCNum <= 0) {
      setError("Amounts must be greater than 0");
      return;
    }

    // Check balances
    if (amountANum > getBalance('USDC')) {
      setError("Insufficient USDC balance");
      return;
    }
    if (amountBNum > getBalance('USDT')) {
      setError("Insufficient USDT balance");
      return;
    }
    if (amountCNum > getBalance('SUI')) {
      setError("Insufficient SUI balance");
      return;
    }

    setError(null);
    setSuccess(null);
    setProcessing(true);

    try {
      const result = await addLiquidity({
        amountA,
        amountB,
        amountC,
      });

      if (result.success) {
        setSuccess(`Successfully added liquidity! Transaction: ${result.digest?.slice(0, 10)}...`);
        setAmountA("");
        setAmountB("");
        setAmountC("");
        await refreshBalances();
      } else {
        setError(result.error || "Failed to add liquidity");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!wallet.connected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!isConfigured) {
      setError("Ampere Protocol is not configured. Please check your .env.local file.");
      return;
    }

    const lpAmountNum = parseFloat(lpAmount);

    if (!lpAmountNum || lpAmountNum <= 0) {
      setError("Please enter a valid LP token amount");
      return;
    }

    if (lpAmountNum > getBalance('LP')) {
      setError("Insufficient LP token balance");
      return;
    }

    setError(null);
    setSuccess(null);
    setProcessing(true);

    try {
      const result = await removeLiquidity({
        lpAmount,
      });

      if (result.success) {
        setSuccess(`Successfully removed liquidity! Transaction: ${result.digest?.slice(0, 10)}...`);
        setLpAmount("");
        await refreshBalances();
      } else {
        setError(result.error || "Failed to remove liquidity");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const setMaxAmount = (symbol: TokenSymbol, setter: (value: string) => void) => {
    const balance = getBalance(symbol);
    // Reserve some SUI for gas
    if (symbol === 'SUI') {
      const maxSui = Math.max(0, balance - 0.1);
      setter(maxSui.toFixed(6));
    } else {
      setter(balance.toFixed(6));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background pt-16"
    >
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-[1200px] px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Droplets className="h-6 w-6" />
                Liquidity Pool
              </h1>
              <p className="text-sm text-muted-foreground">Add or remove liquidity from the USDC/USDT/SUI pool</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Liquidity Operations */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Liquidity</CardTitle>
              <CardDescription>
                Add or remove liquidity to earn trading fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="add" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="add" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </TabsTrigger>
                  <TabsTrigger value="remove" className="flex items-center gap-2">
                    <Minus className="h-4 w-4" />
                    Remove
                  </TabsTrigger>
                </TabsList>

                {/* Add Liquidity Tab */}
                <TabsContent value="add" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {/* USDC Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>USDC Amount</Label>
                        <span className="text-xs text-muted-foreground">
                          Balance: {getBalance('USDC').toFixed(6)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amountA}
                          onChange={(e) => setAmountA(e.target.value)}
                          disabled={processing}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMaxAmount('USDC', setAmountA)}
                          disabled={processing}
                        >
                          Max
                        </Button>
                      </div>
                    </div>

                    {/* USDT Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>USDT Amount</Label>
                        <span className="text-xs text-muted-foreground">
                          Balance: {getBalance('USDT').toFixed(6)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amountB}
                          onChange={(e) => setAmountB(e.target.value)}
                          disabled={processing}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMaxAmount('USDT', setAmountB)}
                          disabled={processing}
                        >
                          Max
                        </Button>
                      </div>
                    </div>

                    {/* SUI Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>SUI Amount</Label>
                        <span className="text-xs text-muted-foreground">
                          Balance: {getBalance('SUI').toFixed(6)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amountC}
                          onChange={(e) => setAmountC(e.target.value)}
                          disabled={processing}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMaxAmount('SUI', setAmountC)}
                          disabled={processing}
                        >
                          Max
                        </Button>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleAddLiquidity}
                      disabled={processing || !wallet.connected || !isConfigured}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding Liquidity...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Liquidity
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* Remove Liquidity Tab */}
                <TabsContent value="remove" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {/* LP Token Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>LP Token Amount</Label>
                        <span className="text-xs text-muted-foreground">
                          Balance: {getBalance('LP').toFixed(6)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={lpAmount}
                          onChange={(e) => setLpAmount(e.target.value)}
                          disabled={processing}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMaxAmount('LP', setLpAmount)}
                          disabled={processing}
                        >
                          Max
                        </Button>
                      </div>
                    </div>

                    <Alert>
                      <AlertDescription>
                        Removing liquidity will return USDC, USDT, and SUI proportional to your LP token share.
                      </AlertDescription>
                    </Alert>

                    <Button
                      className="w-full"
                      onClick={handleRemoveLiquidity}
                      disabled={processing || !wallet.connected || !isConfigured}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Removing Liquidity...
                        </>
                      ) : (
                        <>
                          <Minus className="mr-2 h-4 w-4" />
                          Remove Liquidity
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mt-4 border-green-500 bg-green-50 dark:bg-green-950">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {success}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Balances & Pool Info */}
          <div className="space-y-6">
            {/* Your Balances */}
            <Card>
              <CardHeader>
                <CardTitle>Your Balances</CardTitle>
                <CardDescription>Current token balances in your wallet</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {balances.map((balance) => (
                      <div
                        key={balance.symbol}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="font-medium">{balance.symbol}</div>
                        <div className="text-right">
                          <div className="font-mono">{balance.formatted.toFixed(6)}</div>
                          <div className="text-xs text-muted-foreground">
                            {balance.coinCount} coin{balance.coinCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!wallet.connected && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      Connect your wallet to view balances
                    </AlertDescription>
                  </Alert>
                )}
                
                {!isConfigured && wallet.connected && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      Protocol not configured. Please set up your .env.local file.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Pool Information */}
            <Card>
              <CardHeader>
                <CardTitle>Pool Information</CardTitle>
                <CardDescription>USDC/USDT/SUI Orbital Pool</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pool Type</span>
                  <span className="text-sm font-medium">Orbital Pool (3-Asset)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Assets</span>
                  <span className="text-sm font-medium">USDC / USDT / SUI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">LP Token</span>
                  <span className="text-sm font-medium">AMP-LP</span>
                </div>
                <Alert className="mt-4">
                  <AlertDescription className="text-xs">
                    💡 Tip: Adding liquidity in balanced proportions optimizes your position and minimizes price impact.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
