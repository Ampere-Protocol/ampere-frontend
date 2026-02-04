"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";

interface TradePanelProps {
  pair: string;
}

export function TradePanel({ pair }: TradePanelProps) {
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [buySlippage, setBuySlippage] = useState([0.5]);
  const [sellSlippage, setSellSlippage] = useState([0.5]);

  const [tokenA, tokenB] = pair.split("/");

  return (
    <div className="flex flex-col gap-4">
      {/* Buy Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h3 className="mb-4 text-sm font-semibold text-success">
          Buy {tokenA}
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Amount ({tokenB})</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="font-mono bg-input border-border"
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
            />
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Est. Received</span>
              <span className="font-mono text-foreground">
                {buyAmount ? (parseFloat(buyAmount) * 0.98).toFixed(4) : "0.00"} {tokenA}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Price Impact</span>
              <span className="font-mono text-success">{"<"}0.01%</span>
            </div>
          </div>
          
          <Button className="w-full bg-success text-success-foreground hover:bg-success/90">
            Buy {tokenA}
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
          Sell {tokenA}
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Amount ({tokenA})</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="font-mono bg-input border-border"
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
            />
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Est. Received</span>
              <span className="font-mono text-foreground">
                {sellAmount ? (parseFloat(sellAmount) * 1.02).toFixed(4) : "0.00"} {tokenB}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Price Impact</span>
              <span className="font-mono text-destructive">~0.05%</span>
            </div>
          </div>
          
          <Button variant="destructive" className="w-full">
            Sell {tokenA}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
