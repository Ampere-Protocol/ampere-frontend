"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Minus, Droplets, Loader2, Settings2, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAmpere } from "@/contexts/ampere-context";
import { useWallet } from '@suiet/wallet-kit';
import { formatBalance, type TokenSymbol } from "@/lib/ampere-config";
import type { OrbitalTickConfigInput } from '@/ampere-protocol/src/sdk/types';

interface LiquidityPanelProps {
  onBack: () => void;
}

export function LiquidityPanel({ onBack }: LiquidityPanelProps) {
  const wallet = useWallet();
  const { balances, loading, addLiquidity, removeLiquidity, isConfigured, refreshBalances, poolTicks } = useAmpere();
  
  // Add Liquidity state
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [amountC, setAmountC] = useState("");
  
  // Tick configuration state
  const [useCustomTicks, setUseCustomTicks] = useState(false);
  const [customTicks, setCustomTicks] = useState<OrbitalTickConfigInput[]>([
    { bandBps: 50, weightBps: 6000 },
    { bandBps: 100, weightBps: 4000 },
  ]);
  
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

    // Validate custom ticks if enabled
    if (useCustomTicks) {
      const totalWeight = customTicks.reduce((sum, t) => sum + t.weightBps, 0);
      if (totalWeight !== 10000) {
        setError(`Tick weights must sum to 10000 bps (100%). Current total: ${totalWeight} bps`);
        return;
      }
      
      if (customTicks.some(t => t.bandBps <= 0 || t.weightBps <= 0)) {
        setError("All tick bands and weights must be greater than 0");
        return;
      }
    }

    setError(null);
    setSuccess(null);
    setProcessing(true);

    try {
      const result = await addLiquidity({
        amountA,
        amountB,
        amountC,
        ticks: useCustomTicks ? customTicks : undefined,
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

                    {/* Tick Configuration Section */}
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4 text-muted-foreground" />
                          <Label className="cursor-pointer" onClick={() => setUseCustomTicks(!useCustomTicks)}>
                            Advanced: Custom Tick Configuration
                          </Label>
                        </div>
                        <input
                          type="checkbox"
                          checked={useCustomTicks}
                          onChange={(e) => setUseCustomTicks(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>

                      {useCustomTicks && (
                        <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs text-muted-foreground flex items-start gap-2 flex-1">
                              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>
                                Configure how liquidity is distributed across price bands. Each tick represents a price range.
                              </span>
                            </div>
                            {poolTicks.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCustomTicks(poolTicks.map(t => ({
                                    bandBps: t.bandBps,
                                    weightBps: t.weightBps,
                                  })));
                                }}
                                className="h-7 text-xs whitespace-nowrap"
                              >
                                Copy Current
                              </Button>
                            )}
                          </div>
                          
                          {customTicks.map((tick, index) => (
                            <div key={index} className="flex gap-2 items-start">
                              <div className="flex-1 space-y-2 bg-background p-3 rounded border">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">Tick {index + 1}</span>
                                  {customTicks.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => {
                                        const newTicks = customTicks.filter((_, i) => i !== index);
                                        // Rebalance weights
                                        const totalWeight = newTicks.reduce((sum, t) => sum + t.weightBps, 0);
                                        if (totalWeight > 0) {
                                          newTicks.forEach(t => {
                                            t.weightBps = Math.round((t.weightBps / totalWeight) * 10000);
                                          });
                                        }
                                        setCustomTicks(newTicks);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Band (bps)</Label>
                                    <Input
                                      type="number"
                                      value={tick.bandBps}
                                      onChange={(e) => {
                                        const newTicks = [...customTicks];
                                        newTicks[index].bandBps = parseInt(e.target.value) || 0;
                                        setCustomTicks(newTicks);
                                      }}
                                      className="h-8 text-xs"
                                      min="1"
                                    />
                                    <span className="text-[10px] text-muted-foreground">
                                      {(tick.bandBps / 100).toFixed(2)}%
                                    </span>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Weight (bps)</Label>
                                    <Input
                                      type="number"
                                      value={tick.weightBps}
                                      onChange={(e) => {
                                        const newTicks = [...customTicks];
                                        newTicks[index].weightBps = parseInt(e.target.value) || 0;
                                        setCustomTicks(newTicks);
                                      }}
                                      className="h-8 text-xs"
                                      min="1"
                                      max="10000"
                                    />
                                    <span className="text-[10px] text-muted-foreground">
                                      {(tick.weightBps / 100).toFixed(2)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <div className="flex justify-between items-center pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCustomTicks([...customTicks, { bandBps: 50, weightBps: 1000 }]);
                              }}
                              className="h-7 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Tick
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              Total weight: {customTicks.reduce((sum, t) => sum + t.weightBps, 0)} bps
                              {customTicks.reduce((sum, t) => sum + t.weightBps, 0) !== 10000 && (
                                <span className="text-destructive ml-1">
                                  (should be 10000)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
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

            {/* Current Pool Ticks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Current Pool Ticks
                </CardTitle>
                <CardDescription>Active price bands and liquidity distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {poolTicks.length > 0 ? (
                  <div className="space-y-3">
                    {poolTicks.map((tick, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Tick {index + 1}</span>
                          <div className="flex gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {(tick.bandBps / 100).toFixed(2)}% band
                            </span>
                            <span className="px-2 py-0.5 rounded bg-success/10 text-success">
                              {(tick.weightBps / 100).toFixed(2)}% weight
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-muted-foreground">USDC</div>
                            <div className="font-mono">{formatBalance(tick.balanceA, 'USDC').toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">USDT</div>
                            <div className="font-mono">{formatBalance(tick.balanceB, 'USDT').toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">SUI</div>
                            <div className="font-mono">{formatBalance(tick.balanceC, 'SUI').toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Alert>
                      <AlertDescription className="text-xs">
                        <Info className="h-3 w-3 inline mr-1" />
                        Ticks define price ranges. Liquidity is distributed according to weights.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No tick data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
