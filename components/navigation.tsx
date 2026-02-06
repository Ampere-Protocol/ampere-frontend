"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Triangle } from "lucide-react";
import { ConnectButton } from '@suiet/wallet-kit';

interface NavigationProps {
  onNavigate?: (page: string) => void;
  currentPage?: string;
}

export function Navigation({ onNavigate, currentPage = "home" }: NavigationProps) {

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <button 
          type="button"
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate?.("home")}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Triangle className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">Ampere</span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          <Button
            variant={currentPage === "home" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onNavigate?.("home")}
            className="text-muted-foreground hover:text-foreground"
          >
            Trade
          </Button>
          <Button
            variant={currentPage === "liquidity" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onNavigate?.("liquidity")}
            className="text-muted-foreground hover:text-foreground"
          >
            Add/Remove Liquidity
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          {/* Suiet Wallet Connect Button */}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
