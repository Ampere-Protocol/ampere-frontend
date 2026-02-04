"use client";

import { motion } from "framer-motion";

export function TriAssetWidget() {
  const size = 80;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;

  const vertices = {
    A: { x: centerX, y: centerY - radius },
    B: { x: centerX - radius * Math.cos(Math.PI / 6), y: centerY + radius * Math.sin(Math.PI / 6) + radius * 0.2 },
    C: { x: centerX + radius * Math.cos(Math.PI / 6), y: centerY + radius * Math.sin(Math.PI / 6) + radius * 0.2 },
  };

  // Equilibrium position (center of triangle for balanced state)
  const dotPosition = {
    x: (vertices.A.x + vertices.B.x + vertices.C.x) / 3,
    y: (vertices.A.y + vertices.B.y + vertices.C.y) / 3,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-4 right-4 z-40 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="widgetGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Triangle edges */}
        <polygon
          points={`${vertices.A.x},${vertices.A.y} ${vertices.B.x},${vertices.B.y} ${vertices.C.x},${vertices.C.y}`}
          fill="transparent"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />

        {/* Asset nodes */}
        {Object.entries(vertices).map(([key, pos]) => (
          <g key={key}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={8}
              fill="hsl(var(--card))"
              stroke="hsl(180, 70%, 50%)"
              strokeWidth="1"
            />
            <text
              x={pos.x}
              y={pos.y + 3}
              textAnchor="middle"
              className="fill-foreground text-[8px] font-bold"
            >
              {key}
            </text>
          </g>
        ))}

        {/* Equilibrium dot */}
        <motion.circle
          cx={dotPosition.x}
          cy={dotPosition.y}
          r={4}
          fill="hsl(180, 70%, 50%)"
          filter="url(#widgetGlow)"
          animate={{
            cx: [dotPosition.x - 2, dotPosition.x + 2, dotPosition.x - 1, dotPosition.x + 1, dotPosition.x],
            cy: [dotPosition.y + 1, dotPosition.y - 1, dotPosition.y + 2, dotPosition.y - 2, dotPosition.y],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </svg>
      <p className="mt-1 text-center text-[9px] text-muted-foreground">Ampere State</p>
    </motion.div>
  );
}
