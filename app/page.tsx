"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Navigation } from "@/components/navigation";
import { LandingPage } from "@/components/landing-page";
import { TradingTerminal } from "@/components/trading-terminal";
import { LiquidityPanel } from "@/components/liquidity-panel";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<"home" | "terminal" | "liquidity">("home");
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  const handleSelectPair = (pair: string) => {
    setSelectedPair(pair);
    setCurrentPage("terminal");
  };

  const handleBack = () => {
    setCurrentPage("home");
    setSelectedPair(null);
  };

  const handleNavigate = (page: string) => {
    if (page === "home") {
      handleBack();
    } else if (page === "liquidity") {
      setCurrentPage("liquidity");
      setSelectedPair(null);
    }
  };

  return (
    <>
      <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
      <AnimatePresence mode="wait">
        {currentPage === "home" ? (
          <LandingPage key="landing" onSelectPair={handleSelectPair} />
        ) : currentPage === "liquidity" ? (
          <LiquidityPanel key="liquidity" onBack={handleBack} />
        ) : (
          <TradingTerminal
            key="terminal"
            pair={selectedPair || "A/B"}
            onBack={handleBack}
          />
        )}
      </AnimatePresence>
    </>
  );
}
