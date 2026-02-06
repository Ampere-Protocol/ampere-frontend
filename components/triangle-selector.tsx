"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TriangleSelectorProps {
  mode: "liquidity" | "volume";
  onSelectPair: (pair: string) => void;
}

const assets = {
  A: { name: "USDC", color: "hsl(0, 0%, 100%)", liquidity: 45, volume: 35 },
  B: { name: "USDT", color: "hsl(0, 0%, 100%)", liquidity: 30, volume: 40 },
  C: { name: "SUI",  color: "hsl(0, 0%, 100%)", liquidity: 25, volume: 25 },
};

export function TriangleSelector({ mode, onSelectPair }: TriangleSelectorProps) {
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
    const d =
      mode === "liquidity"
        ? { a: assets.A.liquidity, b: assets.B.liquidity, c: assets.C.liquidity }
        : { a: assets.A.volume, b: assets.B.volume, c: assets.C.volume };

    const total = d.a + d.b + d.c;

    return {
      x:
        vertices.A.x * (d.a / total) +
        vertices.B.x * (d.b / total) +
        vertices.C.x * (d.c / total),
      y:
        vertices.A.y * (d.a / total) +
        vertices.B.y * (d.b / total) +
        vertices.C.y * (d.c / total),
    };
  }, [mode]);

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
