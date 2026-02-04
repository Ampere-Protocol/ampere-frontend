"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TriangleSelector } from "@/components/triangle-selector";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  onSelectPair: (pair: string) => void;
}

export function LandingPage({ onSelectPair }: LandingPageProps) {
  const [mode, setMode] = useState<"liquidity" | "volume">("liquidity");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-screen flex-col items-center justify-center bg-background pt-16"
    >
      <div className="mx-auto max-w-2xl px-4 text-center">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            Tri-Asset Trading
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Select any trading pair by clicking an edge of the triangle.
            Watch how liquidity and volume flow across all three assets.
          </p>
        </motion.div>

        {/* Mode toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex items-center justify-center"
        >
          <div className="inline-flex items-center rounded-lg border border-border bg-card p-1">
            <Button
              variant={mode === "liquidity" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("liquidity")}
              className="px-4"
            >
              Liquidity
            </Button>
            <Button
              variant={mode === "volume" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("volume")}
              className="px-4"
            >
              Volume
            </Button>
          </div>
        </motion.div>

        {/* Triangle selector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <TriangleSelector mode={mode} onSelectPair={onSelectPair} />
        </motion.div>

        {/* Instructions */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          Hover over assets to see {mode} distribution. Click an edge to trade.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 grid grid-cols-3 gap-4"
        >
          {[
            { label: "Total Liquidity", value: "$12.4M" },
            { label: "24h Volume", value: "$2.8M" },
            { label: "Active Pairs", value: "3" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-xl font-semibold text-foreground font-mono">
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
