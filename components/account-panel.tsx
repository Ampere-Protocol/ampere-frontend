"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, History, ClipboardList } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AccountPanelProps {
  pair: string;
}

interface Balance {
  token: string;
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

function generateBalances(): Balance[] {
  return [
    { token: "A", available: 1234.5678, inOrder: 100.0, total: 1334.5678, usdValue: 15420.45 },
    { token: "B", available: 567.8901, inOrder: 50.0, total: 617.8901, usdValue: 8234.12 },
    { token: "C", available: 2345.6789, inOrder: 200.0, total: 2545.6789, usdValue: 12890.67 },
  ];
}

function generateRecentTrades(count: number): Trade[] {
  const trades: Trade[] = [];
  let basePrice = 124.5;
  const pairs = ["A/B", "B/C", "A/C"];
  
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
  const pairs = ["A/B", "B/C", "A/C"];
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
  const balances = useMemo(() => generateBalances(), []);
  const recentTrades = useMemo(() => generateRecentTrades(10), [pair]);
  const orderHistory = useMemo(() => generateOrderHistory(8), []);

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
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Token</th>
                  <th className="px-3 py-2 text-right font-medium">Available</th>
                  <th className="px-3 py-2 text-right font-medium">In Order</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 text-right font-medium">USD Value</th>
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
                        <span className="font-medium text-foreground">Token {balance.token}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-foreground">
                      {balance.available.toFixed(4)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                      {balance.inOrder.toFixed(4)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-foreground font-medium">
                      {balance.total.toFixed(4)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-success">
                      ${balance.usdValue.toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Portfolio Value</span>
              <span className="font-mono font-semibold text-foreground">
                ${balances.reduce((sum, b) => sum + b.usdValue, 0).toLocaleString()}
              </span>
            </div>
          </div>
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
