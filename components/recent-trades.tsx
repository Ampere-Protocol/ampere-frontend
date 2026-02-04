"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface RecentTradesProps {
  pair: string;
}

interface Trade {
  id: number;
  type: "buy" | "sell";
  price: number;
  amount: number;
  time: string;
}

function generateTrades(count: number): Trade[] {
  const trades: Trade[] = [];
  let basePrice = 124.5;
  
  for (let i = 0; i < count; i++) {
    const type = Math.random() > 0.5 ? "buy" : "sell";
    const priceChange = (Math.random() - 0.5) * 0.5;
    basePrice += priceChange;
    
    trades.push({
      id: i,
      type,
      price: basePrice,
      amount: Math.random() * 50 + 1,
      time: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(
        Math.floor(Math.random() * 60)
      ).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
    });
  }
  
  return trades.reverse();
}

export function RecentTrades({ pair }: RecentTradesProps) {
  const trades = useMemo(() => generateTrades(15), [pair]);
  const [tokenA, tokenB] = pair.split("/");

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Recent Trades</h3>
      </div>
      
      <div className="overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Price ({tokenB})</th>
              <th className="px-4 py-2 text-right font-medium">Amount ({tokenA})</th>
              <th className="px-4 py-2 text-right font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => (
              <motion.tr
                key={trade.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="border-b border-border/50 last:border-0"
              >
                <td
                  className={`px-4 py-1.5 font-mono ${
                    trade.type === "buy" ? "text-success" : "text-destructive"
                  }`}
                >
                  {trade.price.toFixed(4)}
                </td>
                <td className="px-4 py-1.5 text-right font-mono text-foreground">
                  {trade.amount.toFixed(4)}
                </td>
                <td className="px-4 py-1.5 text-right font-mono text-muted-foreground">
                  {trade.time}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
