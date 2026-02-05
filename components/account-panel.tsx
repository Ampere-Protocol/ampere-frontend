"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, History, ClipboardList, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAmpere } from "@/contexts/ampere-context";
import { useWallet } from "@suiet/wallet-kit";
import { AMPERE_CONFIG } from "@/lib/ampere-config";

interface AccountPanelProps {
  pair: string;
}

interface Balance {
  token: string;
  name: string;
  available: number;
  inOrder: number;
  total: number;
  usdValue: number;
}

interface Trade {
  id: number;
  type: "buy" | "sell";
  pair: string;
  price: number;
  amount: number;
  total: number;
  time: string;
  status: "filled";
}

interface Order {
  id: number;
  type: "buy" | "sell";
  pair: string;
  price: number;
  amount: number;
  filled: number;
  time: string;
  status: "open" | "partial" | "cancelled";
}

function generateRecentTrades(count: number): Trade[] {
  const trades: Trade[] = [];
  let basePrice = 124.5;
  const pairs = ["USDC/USDT", "USDT/SUI", "USDC/SUI"];
  
  for (let i = 0; i < count; i++) {
    const type = Math.random() > 0.5 ? "buy" : "sell";
    const priceChange = (Math.random() - 0.5) * 0.5;
    basePrice += priceChange;
    const amount = Math.random() * 50 + 1;
    
    trades.push({
      id: i,
      type,
      pair: pairs[Math.floor(Math.random() * pairs.length)],
      price: basePrice,
      amount,
      total: basePrice * amount,
      time: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(
        Math.floor(Math.random() * 60)
      ).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      status: "filled",
    });
  }
  
  return trades.reverse();
}

function generateOrderHistory(count: number): Order[] {
  const orders: Order[] = [];
  let basePrice = 124.5;
  const pairs = ["USDC/USDT", "USDT/SUI", "USDC/SUI"];
  const statuses: ("open" | "partial" | "cancelled")[] = ["open", "partial", "cancelled"];
  
  for (let i = 0; i < count; i++) {
    const type = Math.random() > 0.5 ? "buy" : "sell";
    const priceChange = (Math.random() - 0.5) * 2;
    basePrice += priceChange;
    const amount = Math.random() * 100 + 10;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    orders.push({
      id: i,
      type,
      pair: pairs[Math.floor(Math.random() * pairs.length)],
      price: basePrice,
      amount,
      filled: status === "cancelled" ? 0 : status === "partial" ? amount * Math.random() * 0.8 : 0,
      time: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(
        Math.floor(Math.random() * 60)
      ).padStart(2, "0")}`,
      status,
    });
  }
  
  return orders.reverse();
}

export function AccountPanel({ pair }: AccountPanelProps) {
  const { connected } = useWallet();
  const { balances: ampereBalances, loading, refreshBalances, isConfigured } = useAmpere();
  const recentTrades = useMemo(() => generateRecentTrades(10), [pair]);
  const orderHistory = useMemo(() => generateOrderHistory(8), []);

  // Convert Ampere balances to display format
  const balances: Balance[] = useMemo(() => {
    if (!connected || ampereBalances.length === 0) {
      return [];
    }

    return ampereBalances
      .filter(b => b.symbol !== 'LP') // Don't show LP token in main balance view
      .map((b) => {
        const tokenMeta = AMPERE_CONFIG.tokens[b.symbol];
        return {
          token: b.symbol,
          name: tokenMeta.name,
          available: b.formatted,
          inOrder: 0, // TODO: Track in-order amounts
          total: b.formatted,
          usdValue: 0, // TODO: Calculate USD value
        };
      });
  }, [ampereBalances, connected]);

  return (
    <div className="rounded-xl border border-border bg-card">
      <Tabs defaultValue="balance" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-border bg-transparent h-11">
          <TabsTrigger 
            value="balance" 
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs"
          >
            <Wallet className="h-3.5 w-3.5" />
            Balance
          </TabsTrigger>
          <TabsTrigger 
            value="trades" 
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs"
          >
            <History className="h-3.5 w-3.5" />
            Trades
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Orders
          </TabsTrigger>
        </TabsList>

        {/* Balance Tab */}
        <TabsContent value="balance" className="mt-0">
          {!isConfigured ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="rounded-full bg-destructive/10 p-3 mb-3">
                <Wallet className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Configuration Required</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Please set up your <code className="bg-muted px-1 py-0.5 rounded text-xs">.env.local</code> file with your deployed contract addresses.
              </p>
              <ol className="text-xs text-left text-muted-foreground space-y-1">
                <li>1. Copy <code className="bg-muted px-1 py-0.5 rounded">.env.example</code> to <code className="bg-muted px-1 py-0.5 rounded">.env.local</code></li>
                <li>2. Fill in your package ID, pool ID, and token addresses</li>
                <li>3. Restart the development server</li>
              </ol>
            </div>
          ) : !connected ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Connect your wallet to view balances</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : balances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No balances found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="px-3 py-2 text-left font-medium">Token</th>
                      <th className="px-3 py-2 text-right font-medium">Available</th>
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((balance, index) => (
                      <motion.tr
                        key={balance.token}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/30"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                              {balance.token}
                            </div>
                            <span className="font-medium text-foreground">{balance.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-foreground">
                          {balance.available.toFixed(6)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-foreground font-medium">
                          {balance.total.toFixed(6)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border px-3 py-2 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshBalances}
                  disabled={loading}
                  className="h-7 text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Recent Trades Tab */}
        <TabsContent value="trades" className="mt-0">
          <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Pair</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-right font-medium">Price</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade, index) => (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-3 py-1.5 font-medium text-foreground">{trade.pair}</td>
                    <td className="px-3 py-1.5">
                      <span className={`font-medium ${trade.type === "buy" ? "text-success" : "text-destructive"}`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-foreground">
                      {trade.price.toFixed(4)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-foreground">
                      {trade.amount.toFixed(4)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-foreground">
                      {trade.total.toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">
                      {trade.time}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Order History Tab */}
        <TabsContent value="orders" className="mt-0">
          <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Pair</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-right font-medium">Price</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 text-right font-medium">Filled</th>
                  <th className="px-3 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orderHistory.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-3 py-1.5 font-medium text-foreground">{order.pair}</td>
                    <td className="px-3 py-1.5">
                      <span className={`font-medium ${order.type === "buy" ? "text-success" : "text-destructive"}`}>
                        {order.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-foreground">
                      {order.price.toFixed(4)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-foreground">
                      {order.amount.toFixed(4)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-foreground">
                      {order.filled.toFixed(4)}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        order.status === "open" 
                          ? "bg-primary/20 text-primary" 
                          : order.status === "partial"
                          ? "bg-chart-5/20 text-chart-5"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
