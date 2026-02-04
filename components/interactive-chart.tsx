"use client";

import React from "react"

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface InteractiveChartProps {
  pair: string;
  timeframe: string;
  chartType: "candlestick" | "line";
  indicators: string[];
}

interface CandleData {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

function generateCandleData(count: number): CandleData[] {
  const data: CandleData[] = [];
  let price = 100 + Math.random() * 50;
  const now = Date.now();
  
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
      timestamp: now - (count - i) * 3600000,
    });
    
    price = close;
  }
  
  return data;
}

function calculateMA(data: CandleData[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((sum, d) => sum + d.close, 0) / period;
  });
}

function calculateEMA(data: CandleData[], period: number): (number | null)[] {
  const multiplier = 2 / (period + 1);
  const ema: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(null);
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((s, d) => s + d.close, 0);
      ema.push(sum / period);
    } else {
      const prevEma = ema[i - 1];
      if (prevEma !== null) {
        ema.push((data[i].close - prevEma) * multiplier + prevEma);
      } else {
        ema.push(null);
      }
    }
  }
  
  return ema;
}

function calculateBollingerBands(data: CandleData[], period: number = 20): { upper: (number | null)[], middle: (number | null)[], lower: (number | null)[] } {
  const ma = calculateMA(data, period);
  
  return {
    upper: data.map((_, i) => {
      if (i < period - 1 || ma[i] === null) return null;
      const slice = data.slice(i - period + 1, i + 1);
      const mean = ma[i]!;
      const variance = slice.reduce((sum, d) => sum + Math.pow(d.close - mean, 2), 0) / period;
      return mean + 2 * Math.sqrt(variance);
    }),
    middle: ma,
    lower: data.map((_, i) => {
      if (i < period - 1 || ma[i] === null) return null;
      const slice = data.slice(i - period + 1, i + 1);
      const mean = ma[i]!;
      const variance = slice.reduce((sum, d) => sum + Math.pow(d.close - mean, 2), 0) / period;
      return mean - 2 * Math.sqrt(variance);
    }),
  };
}

export function InteractiveChart({ pair, timeframe, chartType, indicators }: InteractiveChartProps) {
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });
  const chartRef = useRef<SVGSVGElement>(null);
  
  const allCandles = useMemo(() => generateCandleData(200), [pair, timeframe]);
  
  // Calculate visible range based on zoom and pan
  const visibleCount = Math.floor(50 / zoomLevel);
  const maxOffset = Math.max(0, allCandles.length - visibleCount);
  const startIdx = Math.min(Math.max(0, Math.floor(panOffset)), maxOffset);
  const candles = allCandles.slice(startIdx, startIdx + visibleCount);
  
  // Calculate indicators
  const ma7 = useMemo(() => indicators.includes("MA7") ? calculateMA(allCandles, 7).slice(startIdx, startIdx + visibleCount) : [], [allCandles, indicators, startIdx, visibleCount]);
  const ma25 = useMemo(() => indicators.includes("MA25") ? calculateMA(allCandles, 25).slice(startIdx, startIdx + visibleCount) : [], [allCandles, indicators, startIdx, visibleCount]);
  const ema12 = useMemo(() => indicators.includes("EMA12") ? calculateEMA(allCandles, 12).slice(startIdx, startIdx + visibleCount) : [], [allCandles, indicators, startIdx, visibleCount]);
  const bollinger = useMemo(() => indicators.includes("BB") ? {
    upper: calculateBollingerBands(allCandles).upper.slice(startIdx, startIdx + visibleCount),
    middle: calculateBollingerBands(allCandles).middle.slice(startIdx, startIdx + visibleCount),
    lower: calculateBollingerBands(allCandles).lower.slice(startIdx, startIdx + visibleCount),
  } : null, [allCandles, indicators, startIdx, visibleCount]);
  
  const minPrice = Math.min(...candles.map(c => c.low)) - 5;
  const maxPrice = Math.max(...candles.map(c => c.high)) + 5;
  const priceRange = maxPrice - minPrice;
  
  const chartHeight = 300;
  const chartWidth = 100;
  const candleWidth = (chartWidth / visibleCount) * 0.7;
  const candleGap = (chartWidth / visibleCount) * 0.3;
  
  const scaleY = useCallback((price: number) => {
    return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  }, [minPrice, priceRange, chartHeight]);

  const priceLabels = useMemo(() => {
    const labels = [];
    const step = priceRange / 5;
    for (let i = 0; i <= 5; i++) {
      labels.push((minPrice + step * i).toFixed(2));
    }
    return labels;
  }, [minPrice, priceRange]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(prev => Math.min(Math.max(0.5, prev + delta), 3));
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, offset: panOffset });
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - dragStart.x) / rect.width;
    const newOffset = dragStart.offset - deltaX * visibleCount;
    setPanOffset(Math.min(Math.max(0, newOffset), maxOffset));
  }, [isDragging, dragStart, visibleCount, maxOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Generate line path for line chart
  const linePath = useMemo(() => {
    if (chartType !== "line") return "";
    return candles.map((candle, i) => {
      const x = i * (candleWidth + candleGap) + candleGap + candleWidth / 2;
      const y = scaleY(candle.close);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [candles, chartType, candleWidth, candleGap, scaleY]);

  // Generate indicator paths
  const generateIndicatorPath = useCallback((values: (number | null)[]) => {
    let path = "";
    values.forEach((value, i) => {
      if (value === null) return;
      const x = i * (candleWidth + candleGap) + candleGap + candleWidth / 2;
      const y = scaleY(value);
      if (path === "" || values[i - 1] === null) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    return path;
  }, [candleWidth, candleGap, scaleY]);

  return (
    <div className="relative h-full w-full select-none">
      {/* Zoom controls */}
      <div className="absolute top-2 right-20 z-10 flex items-center gap-2">
        <button
          onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))}
          className="flex h-7 w-7 items-center justify-center rounded bg-secondary text-foreground hover:bg-secondary/80 text-sm font-bold"
        >
          +
        </button>
        <span className="text-xs text-muted-foreground font-mono">{(zoomLevel * 100).toFixed(0)}%</span>
        <button
          onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
          className="flex h-7 w-7 items-center justify-center rounded bg-secondary text-foreground hover:bg-secondary/80 text-sm font-bold"
        >
          -
        </button>
        <button
          onClick={() => { setZoomLevel(1); setPanOffset(allCandles.length - 50); }}
          className="ml-2 rounded bg-secondary px-2 py-1 text-xs text-foreground hover:bg-secondary/80"
        >
          Reset
        </button>
      </div>

      {/* Navigation hint */}
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
        Scroll to zoom | Drag to pan | Showing {Math.floor(startIdx + 1)}-{Math.floor(startIdx + visibleCount)} of {allCandles.length}
      </div>
      
      {/* Price labels */}
      <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground py-2 pr-2">
        {[...priceLabels].reverse().map((label, i) => (
          <span key={i} className="font-mono">{label}</span>
        ))}
      </div>
      
      {/* Chart area */}
      <div 
        className="absolute inset-0 right-16"
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={chartRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className={`h-full w-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          preserveAspectRatio="none"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
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

          {/* Bollinger Bands */}
          {bollinger && (
            <>
              <path
                d={generateIndicatorPath(bollinger.upper)}
                fill="none"
                stroke="hsl(280, 70%, 60%)"
                strokeWidth="0.2"
                strokeOpacity="0.6"
              />
              <path
                d={generateIndicatorPath(bollinger.middle)}
                fill="none"
                stroke="hsl(280, 70%, 60%)"
                strokeWidth="0.15"
                strokeOpacity="0.4"
                strokeDasharray="1 1"
              />
              <path
                d={generateIndicatorPath(bollinger.lower)}
                fill="none"
                stroke="hsl(280, 70%, 60%)"
                strokeWidth="0.2"
                strokeOpacity="0.6"
              />
            </>
          )}

          {/* MA7 */}
          {ma7.length > 0 && (
            <path
              d={generateIndicatorPath(ma7)}
              fill="none"
              stroke="hsl(45, 90%, 55%)"
              strokeWidth="0.25"
            />
          )}

          {/* MA25 */}
          {ma25.length > 0 && (
            <path
              d={generateIndicatorPath(ma25)}
              fill="none"
              stroke="hsl(200, 80%, 55%)"
              strokeWidth="0.25"
            />
          )}

          {/* EMA12 */}
          {ema12.length > 0 && (
            <path
              d={generateIndicatorPath(ema12)}
              fill="none"
              stroke="hsl(320, 70%, 55%)"
              strokeWidth="0.25"
            />
          )}
          
          {chartType === "candlestick" ? (
            /* Candles */
            candles.map((candle, i) => {
              const x = i * (candleWidth + candleGap) + candleGap;
              const isGreen = candle.close >= candle.open;
              const bodyTop = scaleY(Math.max(candle.open, candle.close));
              const bodyBottom = scaleY(Math.min(candle.open, candle.close));
              const bodyHeight = Math.max(bodyBottom - bodyTop, 0.5);
              const isHovered = hoveredCandle === i;
              const candleColor = isGreen ? "hsl(145, 65%, 40%)" : "hsl(0, 65%, 45%)";
              
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
                    stroke={candleColor}
                    strokeWidth="0.2"
                  />
                  {/* Body - solid fill with same color as wick */}
                  <motion.rect
                    x={x}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={candleColor}
                    stroke={candleColor}
                    strokeWidth="0.1"
                    rx="0.1"
                    animate={{
                      opacity: isHovered ? 1 : 1,
                      scale: isHovered ? 1.05 : 1,
                    }}
                  />
                </g>
              );
            })
          ) : (
            /* Line chart */
            <>
              {/* Area fill */}
              <path
                d={`${linePath} L ${(candles.length - 1) * (candleWidth + candleGap) + candleGap + candleWidth / 2} ${chartHeight} L ${candleGap + candleWidth / 2} ${chartHeight} Z`}
                fill="url(#lineGradient)"
                opacity="0.3"
              />
              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="hsl(180, 70%, 50%)"
                strokeWidth="0.4"
              />
              {/* Dots on hover */}
              {candles.map((candle, i) => {
                const x = i * (candleWidth + candleGap) + candleGap + candleWidth / 2;
                const y = scaleY(candle.close);
                const isHovered = hoveredCandle === i;
                
                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredCandle(i)}
                    onMouseLeave={() => setHoveredCandle(null)}
                    className="cursor-crosshair"
                  >
                    <rect
                      x={x - candleWidth / 2}
                      y={0}
                      width={candleWidth}
                      height={chartHeight}
                      fill="transparent"
                    />
                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r="1"
                        fill="hsl(180, 70%, 50%)"
                      />
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* Gradient definition for line chart */}
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(180, 70%, 50%)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(180, 70%, 50%)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Hover tooltip */}
        {hoveredCandle !== null && candles[hoveredCandle] && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 left-2 rounded-lg border border-border bg-card p-3 text-xs shadow-lg"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-muted-foreground">Time</span>
              <span className="font-mono text-foreground">
                {new Date(candles[hoveredCandle].timestamp).toLocaleString()}
              </span>
              <span className="text-muted-foreground">Open</span>
              <span className="font-mono text-foreground">{candles[hoveredCandle].open.toFixed(4)}</span>
              <span className="text-muted-foreground">High</span>
              <span className="font-mono text-foreground">{candles[hoveredCandle].high.toFixed(4)}</span>
              <span className="text-muted-foreground">Low</span>
              <span className="font-mono text-foreground">{candles[hoveredCandle].low.toFixed(4)}</span>
              <span className="text-muted-foreground">Close</span>
              <span className="font-mono text-foreground">{candles[hoveredCandle].close.toFixed(4)}</span>
              <span className="text-muted-foreground">Volume</span>
              <span className="font-mono text-foreground">{candles[hoveredCandle].volume.toFixed(2)}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
