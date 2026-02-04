"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TriangleSelectorProps {
  mode: "liquidity" | "volume";
  onSelectPair: (pair: string) => void;
}

const assets = {
  A: { name: "Token A", color: "hsl(0, 0%, 100%)", liquidity: 45, volume: 35 },
  B: { name: "Token B", color: "hsl(0, 0%, 100%)", liquidity: 30, volume: 40 },
  C: { name: "Token C", color: "hsl(0, 0%, 100%)", liquidity: 25, volume: 25 },
};

export function TriangleSelector({ mode, onSelectPair }: TriangleSelectorProps) {
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  const triangleSize = 320;
  const centerX = triangleSize / 2;
  const centerY = triangleSize / 2;
  const radius = triangleSize * 0.38;

  // Triangle vertices
  const vertices = {
    A: { x: centerX, y: centerY - radius },
    B: { x: centerX - radius * Math.cos(Math.PI / 6), y: centerY + radius * Math.sin(Math.PI / 6) + radius * 0.3 },
    C: { x: centerX + radius * Math.cos(Math.PI / 6), y: centerY + radius * Math.sin(Math.PI / 6) + radius * 0.3 },
  };

  // Calculate dot position based on mode
  const dotPosition = useMemo(() => {
    const data = mode === "liquidity" 
      ? { a: assets.A.liquidity, b: assets.B.liquidity, c: assets.C.liquidity }
      : { a: assets.A.volume, b: assets.B.volume, c: assets.C.volume };
    
    const total = data.a + data.b + data.c;
    const wA = data.a / total;
    const wB = data.b / total;
    const wC = data.c / total;

    return {
      x: vertices.A.x * wA + vertices.B.x * wB + vertices.C.x * wC,
      y: vertices.A.y * wA + vertices.B.y * wB + vertices.C.y * wC,
    };
  }, [mode]);

  const edges = [
    { id: "A/B", from: "A", to: "B", pair: "A/B" },
    { id: "B/C", from: "B", to: "C", pair: "B/C" },
    { id: "A/C", from: "A", to: "C", pair: "A/C" },
  ];

  const getEdgeMidpoint = (from: string, to: string) => {
    const v1 = vertices[from as keyof typeof vertices];
    const v2 = vertices[to as keyof typeof vertices];
    return { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
  };

  const handleEdgeClick = (pair: string) => {
    setSelectedEdge(pair);
    onSelectPair(pair);
  };

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={triangleSize}
        height={triangleSize}
        viewBox={`0 0 ${triangleSize} ${triangleSize}`}
        className="overflow-visible"
      >
        {/* Defs for gradients and filters */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" />
          </filter>
          {/* Token A gradient - Cyan at top */}
          <radialGradient id="tokenAGlow" cx={vertices.A.x} cy={vertices.A.y} r={radius * 1.8} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(180, 85%, 55%)" stopOpacity="0.7" />
            <stop offset="40%" stopColor="hsl(180, 80%, 50%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          {/* Token B gradient - Green at bottom left */}
          <radialGradient id="tokenBGlow" cx={vertices.B.x} cy={vertices.B.y} r={radius * 1.8} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(145, 80%, 50%)" stopOpacity="0.7" />
            <stop offset="40%" stopColor="hsl(145, 75%, 45%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          {/* Token C gradient - Orange/Amber at bottom right */}
          <radialGradient id="tokenCGlow" cx={vertices.C.x} cy={vertices.C.y} r={radius * 1.8} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(35, 90%, 55%)" stopOpacity="0.7" />
            <stop offset="40%" stopColor="hsl(35, 85%, 50%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          {/* Clip path for triangle */}
          <clipPath id="triangleClip">
            <polygon points={`${vertices.A.x},${vertices.A.y} ${vertices.B.x},${vertices.B.y} ${vertices.C.x},${vertices.C.y}`} />
          </clipPath>
        </defs>

        {/* Base triangle with dark fill */}
        <polygon
          points={`${vertices.A.x},${vertices.A.y} ${vertices.B.x},${vertices.B.y} ${vertices.C.x},${vertices.C.y}`}
          fill="hsl(220, 20%, 8%)"
        />

        {/* Token-based gradient layers - clipped to triangle */}
        <g clipPath="url(#triangleClip)">
          {/* Token A glow from top */}
          <circle
            cx={vertices.A.x}
            cy={vertices.A.y}
            r={radius * 1.5}
            fill="url(#tokenAGlow)"
            filter="url(#softBlur)"
          />
          {/* Token B glow from bottom-left */}
          <circle
            cx={vertices.B.x}
            cy={vertices.B.y}
            r={radius * 1.5}
            fill="url(#tokenBGlow)"
            filter="url(#softBlur)"
          />
          {/* Token C glow from bottom-right */}
          <circle
            cx={vertices.C.x}
            cy={vertices.C.y}
            r={radius * 1.5}
            fill="url(#tokenCGlow)"
            filter="url(#softBlur)"
          />
        </g>

        {/* Edges - Visual elements first (below hit areas) */}
        {edges.map((edge) => {
          const v1 = vertices[edge.from as keyof typeof vertices];
          const v2 = vertices[edge.to as keyof typeof vertices];
          const isHovered = hoveredEdge === edge.id;
          const isSelected = selectedEdge === edge.id;

          return (
            <g key={`visual-${edge.id}`} style={{ pointerEvents: "none" }}>
              {/* Glow effect for selected/hovered */}
              {(isHovered || isSelected) && (
                <motion.line
                  x1={v1.x}
                  y1={v1.y}
                  x2={v2.x}
                  y2={v2.y}
                  stroke="hsl(0, 0%, 100%)"
                  strokeWidth={16}
                  strokeLinecap="round"
                  strokeOpacity={0.3}
                  filter="url(#glow)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
              {/* Visible edge - bold white stroke */}
              <motion.line
                x1={v1.x}
                y1={v1.y}
                x2={v2.x}
                y2={v2.y}
                stroke="hsl(0, 0%, 100%)"
                strokeWidth={isHovered || isSelected ? 6 : 4}
                strokeLinecap="round"
                initial={false}
                animate={{ 
                  strokeWidth: isHovered || isSelected ? 6 : 4,
                  opacity: isHovered || isSelected ? 1 : 0.85 
                }}
                transition={{ duration: 0.2 }}
              />
              {/* Edge label */}
              <AnimatePresence>
                {isHovered && (
                  <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <rect
                      x={getEdgeMidpoint(edge.from, edge.to).x - 30}
                      y={getEdgeMidpoint(edge.from, edge.to).y - 14}
                      width="60"
                      height="28"
                      rx="8"
                      fill="hsl(180, 70%, 50%)"
                      className="drop-shadow-lg"
                    />
                    <text
                      x={getEdgeMidpoint(edge.from, edge.to).x}
                      y={getEdgeMidpoint(edge.from, edge.to).y + 5}
                      textAnchor="middle"
                      className="fill-background text-sm font-bold"
                    >
                      {edge.pair}
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
              {/* Selected indicator */}
              {isSelected && !isHovered && (
                <motion.circle
                  cx={getEdgeMidpoint(edge.from, edge.to).x}
                  cy={getEdgeMidpoint(edge.from, edge.to).y}
                  r={6}
                  fill="hsl(180, 70%, 50%)"
                  filter="url(#glow)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
              )}
            </g>
          );
        })}

        {/* Asset nodes */}
        {Object.entries(vertices).map(([key, pos]) => {
          const asset = assets[key as keyof typeof assets];
          const isHovered = hoveredAsset === key;
          const data = mode === "liquidity" ? asset.liquidity : asset.volume;

          return (
            <g
              key={key}
              onMouseEnter={() => setHoveredAsset(key)}
              onMouseLeave={() => setHoveredAsset(null)}
              className="cursor-pointer"
            >
              {/* Outer glow ring */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 34 : 30}
                fill="transparent"
                stroke={asset.color}
                strokeWidth="3"
                strokeOpacity={isHovered ? 0.6 : 0.3}
                filter={isHovered ? "url(#glow)" : undefined}
                animate={{ r: isHovered ? 34 : 30 }}
              />
              {/* Main circle background */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={24}
                fill="hsl(var(--card))"
                stroke={asset.color}
                strokeWidth="3"
              />
              {/* Inner colored fill */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={20}
                fill={asset.color}
                fillOpacity={0.15}
              />
              {/* Asset label */}
              <text
                x={pos.x}
                y={pos.y + 6}
                textAnchor="middle"
                className="fill-foreground text-base font-bold"
                style={{ fill: asset.color }}
              >
                {key}
              </text>
              {/* Percentage tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.g
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                  >
                    <rect
                      x={pos.x - 40}
                      y={pos.y + 36}
                      width="80"
                      height="32"
                      rx="8"
                      fill="hsl(var(--card))"
                      stroke={asset.color}
                      strokeWidth="2"
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 50}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px] font-medium"
                    >
                      {mode === "liquidity" ? "Liquidity" : "Volume"}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 62}
                      textAnchor="middle"
                      className="fill-foreground text-sm font-bold"
                    >
                      {data}%
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </g>
          );
        })}

        {/* Distribution dot */}
        <motion.circle
          cx={dotPosition.x}
          cy={dotPosition.y}
          r={10}
          fill="hsl(180, 70%, 50%)"
          filter="url(#glow)"
          animate={{ cx: dotPosition.x, cy: dotPosition.y }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{ pointerEvents: "none" }}
        />
        <motion.circle
          cx={dotPosition.x}
          cy={dotPosition.y}
          r={5}
          fill="hsl(var(--background))"
          animate={{ cx: dotPosition.x, cy: dotPosition.y }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{ pointerEvents: "none" }}
        />

        {/* Edge hit areas - rendered last for proper event handling */}
        {edges.map((edge) => {
          const v1 = vertices[edge.from as keyof typeof vertices];
          const v2 = vertices[edge.to as keyof typeof vertices];

          return (
            <line
              key={`hit-${edge.id}`}
              x1={v1.x}
              y1={v1.y}
              x2={v2.x}
              y2={v2.y}
              stroke="transparent"
              strokeWidth="40"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredEdge(edge.id)}
              onMouseLeave={() => setHoveredEdge(null)}
              onClick={() => handleEdgeClick(edge.pair)}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: assets.A.color }} />
          <span>Token A</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: assets.B.color }} />
          <span>Token B</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: assets.C.color }} />
          <span>Token C</span>
        </div>
      </div>
    </div>
  );
}
