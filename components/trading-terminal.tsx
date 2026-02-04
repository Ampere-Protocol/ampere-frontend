"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, LineChart, CableIcon as CandleIcon, Droplets, BarChart3, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InteractiveChart } from "@/components/interactive-chart";
import { TradePanel } from "@/components/trade-panel";
import { AccountPanel } from "@/components/account-panel";
import { TriAssetWidget } from "@/components/tri-asset-widget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TradingTerminalProps {
  pair: string;
  onBack: () => void;
}

const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"];

const indicatorOptions = [
  { id: "MA7", label: "MA (7)", color: "hsl(45, 90%, 55%)" },
  { id: "MA25", label: "MA (25)", color: "hsl(200, 80%, 55%)" },
  { id: "EMA12", label: "EMA (12)", color: "hsl(320, 70%, 55%)" },
  { id: "BB", label: "Bollinger Bands", color: "hsl(280, 70%, 60%)" },
];

export function TradingTerminal({ pair, onBack }: TradingTerminalProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [priceMode, setPriceMode] = useState(pair.split("/")[1]);
  const [chartType, setChartType] = useState<"candlestick" | "line">("candlestick");
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);

  const [tokenA, tokenB] = pair.split("/");
  const allTokens = ["A", "B", "C"];

  // Generate mock data
  const marketData = useMemo(() => ({
    lastPrice: (100 + Math.random() * 50).toFixed(4),
    change24h: ((Math.random() - 0.5) * 10).toFixed(2),
    volume24h: ((Math.random() * 10) + 1).toFixed(2),
    liquidityA: ((Math.random() * 5) + 2).toFixed(2),
    liquidityB: ((Math.random() * 8) + 3).toFixed(2),
    high24h: (130 + Math.random() * 20).toFixed(4),
    low24h: (90 + Math.random() * 10).toFixed(4),
    trades24h: Math.floor(Math.random() * 10000) + 5000,
  }), [pair]);

  const isPositive = parseFloat(marketData.change24h) >= 0;

  const toggleIndicator = (indicatorId: string) => {
    setSelectedIndicators(prev => 
      prev.includes(indicatorId)
        ? prev.filter(id => id !== indicatorId)
        : [...prev, indicatorId]
    );
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
        <div className="mx-auto max-w-[1600px] px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
                <h1 className="text-2xl font-bold text-foreground">{pair}</h1>
                <p className="text-sm text-muted-foreground">Trading Pair</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {/* Last Price */}
              <div>
                <p className="text-xs text-muted-foreground">Last Price</p>
                <p className="text-lg font-mono font-semibold text-foreground">
                  {marketData.lastPrice}
                </p>
              </div>
              
              {/* 24h Change */}
              <div>
                <p className="text-xs text-muted-foreground">24h Change</p>
                <div className={`flex items-center gap-1 ${isPositive ? "text-success" : "text-destructive"}`}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-lg font-mono font-semibold">
                    {isPositive ? "+" : ""}{marketData.change24h}%
                  </span>
                </div>
              </div>

              {/* 24h High/Low */}
              <div>
                <p className="text-xs text-muted-foreground">24h High / Low</p>
                <p className="text-sm font-mono">
                  <span className="text-success">{marketData.high24h}</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-destructive">{marketData.low24h}</span>
                </p>
              </div>
              
              {/* 24h Volume */}
              <div>
                <p className="text-xs text-muted-foreground">24h Volume</p>
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-lg font-mono font-semibold text-foreground">
                    {marketData.volume24h}M
                  </span>
                </div>
              </div>

              {/* Liquidity */}
              <div className="border-l border-border pl-6">
                <p className="text-xs text-muted-foreground mb-1">Total Liquidity</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-mono text-foreground">
                      <span className="text-muted-foreground">{tokenA}:</span> {marketData.liquidityA}M
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Droplets className="h-3.5 w-3.5 text-success" />
                    <span className="text-sm font-mono text-foreground">
                      <span className="text-muted-foreground">{tokenB}:</span> {marketData.liquidityB}M
                    </span>
                  </div>
                </div>
              </div>

              {/* 24h Trades */}
              <div>
                <p className="text-xs text-muted-foreground">24h Trades</p>
                <p className="text-lg font-mono font-semibold text-foreground">
                  {marketData.trades24h.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1600px] p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* Left side - Chart */}
          <div className="space-y-4">
            {/* Chart */}
            <div className="rounded-xl border border-border bg-card p-4">
              {/* Chart controls */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Timeframes */}
                  <div className="flex gap-1">
                    {timeframes.map((tf) => (
                      <Button
                        key={tf}
                        variant={selectedTimeframe === tf ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedTimeframe(tf)}
                        className="h-7 px-3 text-xs"
                      >
                        {tf}
                      </Button>
                    ))}
                  </div>

                  {/* Chart type toggle */}
                  <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                    <Button
                      variant={chartType === "candlestick" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setChartType("candlestick")}
                      className="h-6 w-8 p-0"
                      title="Candlestick"
                    >
                      <CandleIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant={chartType === "line" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setChartType("line")}
                      className="h-6 w-8 p-0"
                      title="Line Chart"
                    >
                      <LineChart className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Indicators dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs bg-transparent">
                        Indicators
                        {selectedIndicators.length > 0 && (
                          <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                            {selectedIndicators.length}
                          </span>
                        )}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {indicatorOptions.map((indicator) => (
                        <DropdownMenuCheckboxItem
                          key={indicator.id}
                          checked={selectedIndicators.includes(indicator.id)}
                          onCheckedChange={() => toggleIndicator(indicator.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: indicator.color }}
                            />
                            {indicator.label}
                          </div>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Price mode */}
                <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                  {allTokens.map((token) => (
                    <Button
                      key={token}
                      variant={priceMode === token ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setPriceMode(token)}
                      className="h-6 px-2 text-xs"
                    >
                      Price in {token}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Active indicators legend */}
              {selectedIndicators.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
                  {indicatorOptions
                    .filter(ind => selectedIndicators.includes(ind.id))
                    .map(indicator => (
                      <div key={indicator.id} className="flex items-center gap-1.5">
                        <div 
                          className="h-0.5 w-4 rounded" 
                          style={{ backgroundColor: indicator.color }}
                        />
                        <span className="text-muted-foreground">{indicator.label}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* Chart area */}
              <div className="h-[450px]">
                <InteractiveChart
                  pair={pair}
                  timeframe={selectedTimeframe}
                  priceMode={priceMode}
                  chartType={chartType}
                  indicators={selectedIndicators}
                />
              </div>
            </div>

            {/* Account Panel - Balance, Recent Trades, Order History */}
            <AccountPanel pair={pair} />
          </div>

          {/* Right side - Trade panel */}
          <div className="lg:sticky lg:top-20 lg:h-fit">
            <TradePanel pair={pair} />
          </div>
        </div>
      </div>

      {/* Tri-Asset Widget */}
      <TriAssetWidget />
    </motion.div>
  );
}
