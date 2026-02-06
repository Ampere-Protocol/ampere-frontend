"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PoolReserves } from "@/contexts/ampere-context";
import { formatBalance } from "@/lib/ampere-config";

interface TriangleSelectorProps {
  mode: "liquidity" | "volume";
  onSelectPair: (pair: string) => void;
  poolReserves?: PoolReserves | null;
}

const assets = {
  A: { name: "USDC", color: "hsl(0, 0%, 100%)" },
  B: { name: "USDT", color: "hsl(0, 0%, 100%)" },
  C: { name: "SUI",  color: "hsl(0, 0%, 100%)" },
};

export function TriangleSelector({ mode, onSelectPair, poolReserves }: TriangleSelectorProps) {
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  const triangleSize = 320;
  const center = triangleSize / 2;
  const radius = triangleSize * 0.38;

  const vertices = {
    A: { x: center, y: center - radius },
    B: {
      x: center - radius * Math.cos(Math.PI / 6),
      y: center + radius * Math.sin(Math.PI / 6) + radius * 0.3,
    },
    C: {
      x: center + radius * Math.cos(Math.PI / 6),
      y: center + radius * Math.sin(Math.PI / 6) + radius * 0.3,
    },
  };

  const dotPosition = useMemo(() => {
    // Calculate distribution based on pool reserves
    let a = 33.33, b = 33.33, c = 33.33; // Default equal distribution
    
    if (poolReserves && mode === "liquidity") {
      // Use actual pool reserves for liquidity mode
      const totalA = formatBalance(poolReserves.usdc, 'USDC');
      const totalB = formatBalance(poolReserves.usdt, 'USDT');
      const totalC = formatBalance(poolReserves.sui, 'SUI') * 2.5; // Approximate SUI value in USD
      
      const total = totalA + totalB + totalC;
      
      if (total > 0) {
        a = (totalA / total) * 100;
        b = (totalB / total) * 100;
        c = (totalC / total) * 100;
      }
    } else if (mode === "volume") {
      // For volume, we could track swaps - for now use a weighted distribution
      // You can update this to track actual volume from swap events
      a = 35;
      b = 40;
      c = 25;
    }

    const total = a + b + c;

    return {
      x:
        vertices.A.x * (a / total) +
        vertices.B.x * (b / total) +
        vertices.C.x * (c / total),
      y:
        vertices.A.y * (a / total) +
        vertices.B.y * (b / total) +
        vertices.C.y * (c / total),
    };
  }, [mode, poolReserves]);

  const edges = [
    { id: "USDC/USDT", from: "A", to: "B", pair: "USDC/USDT" },
    { id: "USDT/SUI",  from: "B", to: "C", pair: "USDT/SUI" },
    { id: "USDC/SUI",  from: "A", to: "C", pair: "USDC/SUI" },
  ];

  const midpoint = (a: string, b: string) => {
    const v1 = vertices[a as keyof typeof vertices];
    const v2 = vertices[b as keyof typeof vertices];
    return { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
  };

  return (
    <div className="relative flex flex-col items-center">
      <svg width={triangleSize} height={triangleSize}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Flat Triangle */}
        <polygon
          points={`${vertices.A.x},${vertices.A.y} ${vertices.B.x},${vertices.B.y} ${vertices.C.x},${vertices.C.y}`}
          fill="hsl(215, 28%, 12%)"
        />

        {/* Edges */}
        {edges.map((e) => {
          const v1 = vertices[e.from as keyof typeof vertices];
          const v2 = vertices[e.to as keyof typeof vertices];
          const active = hoveredEdge === e.id || selectedEdge === e.id;

          return (
            <g key={e.id} style={{ pointerEvents: "none" }}>
              {active && (
                <motion.line
                  x1={v1.x}
                  y1={v1.y}
                  x2={v2.x}
                  y2={v2.y}
                  stroke="white"
                  strokeWidth={14}
                  strokeOpacity={0.25}
                  filter="url(#glow)"
                />
              )}

              <motion.line
                x1={v1.x}
                y1={v1.y}
                x2={v2.x}
                y2={v2.y}
                stroke="white"
                strokeWidth={active ? 6 : 4}
                strokeLinecap="round"
              />

              {hoveredEdge === e.id && (
                <motion.text
                  x={midpoint(e.from, e.to).x}
                  y={midpoint(e.from, e.to).y}
                  textAnchor="middle"
                  className="fill-white text-xs font-bold"
                >
                  {e.pair}
                </motion.text>
              )}
            </g>
          );
        })}

        {/* Asset Nodes */}
        {Object.entries(vertices).map(([k, p]) => {
          const asset = assets[k as keyof typeof assets];
          const hovered = hoveredAsset === k;
          
          // Get actual reserve amounts for display
          let reserveAmount = "";
          if (poolReserves && mode === "liquidity") {
            if (k === "A") {
              reserveAmount = formatBalance(poolReserves.usdc, 'USDC').toFixed(2);
            } else if (k === "B") {
              reserveAmount = formatBalance(poolReserves.usdt, 'USDT').toFixed(2);
            } else if (k === "C") {
              reserveAmount = formatBalance(poolReserves.sui, 'SUI').toFixed(2);
            }
          }

          return (
            <g
              key={k}
              onMouseEnter={() => setHoveredAsset(k)}
              onMouseLeave={() => setHoveredAsset(null)}
              className="cursor-pointer"
            >
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={hovered ? 32 : 28}
                fill="none"
                stroke="white"
                strokeOpacity={0.4}
              />
              <circle cx={p.x} cy={p.y} r={22} fill="hsl(215,30%,15%)" />
              <text
                x={p.x}
                y={p.y + 5}
                textAnchor="middle"
                className="fill-white font-bold"
              >
                {asset.name}
              </text>
              {hovered && reserveAmount && (
                <motion.text
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  x={p.x}
                  y={p.y + 50}
                  textAnchor="middle"
                  className="fill-white text-xs font-medium"
                >
                  {reserveAmount}
                </motion.text>
              )}
            </g>
          );
        })}

        {/* Distribution Dot */}
        <motion.circle
          cx={dotPosition.x}
          cy={dotPosition.y}
          r={9}
          fill="hsl(150,80%,45%)"
          filter="url(#glow)"
          animate={{
            cx: dotPosition.x,
            cy: dotPosition.y,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />

        <motion.circle
          cx={dotPosition.x}
          cy={dotPosition.y}
          r={5}
          fill="hsl(215,30%,15%)"
          animate={{ cx: dotPosition.x, cy: dotPosition.y }}
        />

        {/* Edge Hit Areas */}
        {edges.map((e) => {
          const v1 = vertices[e.from as keyof typeof vertices];
          const v2 = vertices[e.to as keyof typeof vertices];

          return (
            <line
              key={`hit-${e.id}`}
              x1={v1.x}
              y1={v1.y}
              x2={v2.x}
              y2={v2.y}
              stroke="transparent"
              strokeWidth={40}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredEdge(e.id)}
              onMouseLeave={() => setHoveredEdge(null)}
              onClick={() => {
                setSelectedEdge(e.id);
                onSelectPair(e.pair);
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
