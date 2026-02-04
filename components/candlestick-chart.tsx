"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

interface CandlestickChartProps {
  pair: string;
  timeframe: string;
  priceMode: string;
}

function generateCandleData(count: number) {
  const data = [];
  let price = 100 + Math.random() * 50;
  
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 8;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;
    
    data.push({
      open,
      close,
      high,
      low,
      volume: Math.random() * 1000 + 500,
    });
    
    price = close;
  }
  
  return data;
}

export function CandlestickChart({ pair, timeframe, priceMode }: CandlestickChartProps) {
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  
  const candles = useMemo(() => generateCandleData(40), [pair, timeframe, priceMode]);
  
  const minPrice = Math.min(...candles.map(c => c.low)) - 5;
  const maxPrice = Math.max(...candles.map(c => c.high)) + 5;
  const priceRange = maxPrice - minPrice;
  
  const chartHeight = 300;
  const chartWidth = 100;
  const candleWidth = 1.8;
  const candleGap = 0.5;
  
  const scaleY = (price: number) => {
    return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const priceLabels = useMemo(() => {
    const labels = [];
    const step = priceRange / 5;
    for (let i = 0; i <= 5; i++) {
      labels.push((minPrice + step * i).toFixed(2));
    }
    return labels;
  }, [minPrice, priceRange]);

  return (
    <div className="relative h-full w-full">
      {/* Price labels */}
      <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground py-2 pr-2">
        {priceLabels.reverse().map((label, i) => (
          <span key={i} className="font-mono">{label}</span>
        ))}
      </div>
      
      {/* Chart area */}
      <div className="absolute inset-0 right-16">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <line
              key={i}
              x1="0"
              y1={(chartHeight / 5) * i}
              x2={chartWidth}
              y2={(chartHeight / 5) * i}
              stroke="hsl(var(--border))"
              strokeWidth="0.1"
              strokeOpacity="0.5"
            />
          ))}
          
          {/* Candles */}
          {candles.map((candle, i) => {
            const x = i * (candleWidth + candleGap) + candleGap;
            const isGreen = candle.close >= candle.open;
            const bodyTop = scaleY(Math.max(candle.open, candle.close));
            const bodyBottom = scaleY(Math.min(candle.open, candle.close));
            const bodyHeight = Math.max(bodyBottom - bodyTop, 0.5);
            const isHovered = hoveredCandle === i;
            
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredCandle(i)}
                onMouseLeave={() => setHoveredCandle(null)}
                className="cursor-crosshair"
              >
                {/* Wick */}
                <line
                  x1={x + candleWidth / 2}
                  y1={scaleY(candle.high)}
                  x2={x + candleWidth / 2}
                  y2={scaleY(candle.low)}
                  stroke={isGreen ? "hsl(145, 70%, 45%)" : "hsl(0, 70%, 50%)"}
                  strokeWidth="0.15"
                />
                {/* Body */}
                <motion.rect
                  x={x}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={isGreen ? "hsl(145, 70%, 45%)" : "hsl(0, 70%, 50%)"}
                  rx="0.1"
                  animate={{
                    opacity: isHovered ? 1 : 0.85,
                  }}
                />
              </g>
            );
          })}
        </svg>
        
        {/* Hover tooltip */}
        {hoveredCandle !== null && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 left-2 rounded-lg border border-border bg-card p-3 text-xs shadow-lg"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-muted-foreground">Open</span>
              <span className="font-mono text-foreground">{candles[hoveredCandle].open.toFixed(2)}</span>
              <span className="text-muted-foreground">High</span>
              <span className="font-mono text-foreground">{candles[hoveredCandle].high.toFixed(2)}</span>
              <span className="text-muted-foreground">Low</span>
              <span className="font-mono text-foreground">{candles[hoveredCandle].low.toFixed(2)}</span>
              <span className="text-muted-foreground">Close</span>
              <span className="font-mono text-foreground">{candles[hoveredCandle].close.toFixed(2)}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
