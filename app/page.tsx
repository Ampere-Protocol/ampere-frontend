"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Navigation } from "@/components/navigation";
import { LandingPage } from "@/components/landing-page";
import { TradingTerminal } from "@/components/trading-terminal";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<"home" | "terminal">("home");
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
    }
  };

  return (
    <>
      <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
      <AnimatePresence mode="wait">
        {currentPage === "home" ? (
          <LandingPage key="landing" onSelectPair={handleSelectPair} />
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
