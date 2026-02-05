"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Triangle, Wallet, LogOut, ChevronDown } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationProps {
  onNavigate?: (page: string) => void;
  currentPage?: string;
}

/**
 * Format wallet address for display (0x1234...5678)
 */
function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Navigation({ onNavigate, currentPage = "home" }: NavigationProps) {
  const { connected, connecting, account, connect, disconnect, network, setNetwork } = useWallet();

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
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            Docs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            Pools
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          {/* Network Selector */}
          {connected && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <span className="capitalize">{network}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select Network</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setNetwork('testnet')}
                  className={network === 'testnet' ? 'bg-accent' : ''}
                >
                  Testnet
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setNetwork('mainnet')}
                  className={network === 'mainnet' ? 'bg-accent' : ''}
                >
                  Mainnet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Wallet Connection Button */}
          {connected && account ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Wallet className="mr-2 h-4 w-4" />
                  {formatAddress(account.address)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Connected Wallet</span>
                    <span className="font-mono text-xs">{account.address}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnect} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={connect}
              disabled={connecting}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
