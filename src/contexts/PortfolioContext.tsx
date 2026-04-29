import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export interface Holding {
  assetId: string | number;
  assetName: string;
  assetType: string;
  assetImage: string;
  assetYield: string;
  pricePerSlice: number; // USD value at time of purchase (used as oracle price)
  slices: number;
  purchasedAt: number; // unix timestamp ms
}

interface PortfolioContextType {
  holdings: Holding[];
  totalSlices: number;
  totalValueUsd: number;
  avgYield: number;
  addHolding: (holding: Omit<Holding, 'purchasedAt'>) => void;
  removeHolding: (assetId: string | number, slicesToSell: number) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

function storageKey(walletAddress: string) {
  return `spydex_portfolio_v2_${walletAddress}`;
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;

  const [holdings, setHoldings] = useState<Holding[]>([]);

  // Load holdings from localStorage whenever wallet changes
  useEffect(() => {
    if (!walletAddress) {
      setHoldings([]);
      return;
    }
    const key = storageKey(walletAddress);
    const saved = localStorage.getItem(key);
    setHoldings(saved ? JSON.parse(saved) : []);
  }, [walletAddress]);

  const persist = useCallback((updated: Holding[], address: string) => {
    localStorage.setItem(storageKey(address), JSON.stringify(updated));
    setHoldings(updated);
  }, []);

  const addHolding = useCallback((newHolding: Omit<Holding, 'purchasedAt'>) => {
    if (!walletAddress) return;
    setHoldings(prev => {
      const idx = prev.findIndex(h => h.assetId === newHolding.assetId);
      let updated: Holding[];
      if (idx !== -1) {
        // Merge: average price, sum slices
        updated = prev.map((h, i) =>
          i === idx
            ? { ...h, slices: h.slices + newHolding.slices }
            : h
        );
      } else {
        updated = [...prev, { ...newHolding, purchasedAt: Date.now() }];
      }
      persist(updated, walletAddress);
      return updated;
    });
  }, [walletAddress, persist]);

  const removeHolding = useCallback((assetId: string | number, slicesToSell: number) => {
    if (!walletAddress) return;
    setHoldings(prev => {
      const updated = prev
        .map(h =>
          h.assetId === assetId
            ? { ...h, slices: Math.max(0, h.slices - slicesToSell) }
            : h
        )
        .filter(h => h.slices > 0); // Remove fully sold positions
      persist(updated, walletAddress);
      return updated;
    });
  }, [walletAddress, persist]);

  // Derived stats
  const totalSlices = holdings.reduce((sum, h) => sum + h.slices, 0);
  const totalValueUsd = holdings.reduce((sum, h) => sum + h.slices * h.pricePerSlice, 0);
  const avgYield =
    holdings.length === 0
      ? 0
      : holdings.reduce((sum, h) => {
          const yieldPct = parseFloat(h.assetYield.replace('%', '')) || 0;
          return sum + yieldPct * (h.slices / Math.max(totalSlices, 1));
        }, 0);

  return (
    <PortfolioContext.Provider
      value={{ holdings, totalSlices, totalValueUsd, avgYield, addHolding, removeHolding }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
