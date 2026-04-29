import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { usePortfolio } from './PortfolioContext';
import { useWallet } from '@solana/wallet-adapter-react';

// ─── Tier Definitions ────────────────────────────────────────────────────────
export interface VipTier {
  id: number;
  name: string;
  minSlices: number;
  feeRate: number; // percentage e.g. 0.5 = 0.5%
  color: string;
  gradient: string;
  iconGradient: string;
  benefits: string[];
}

export const VIP_TIERS: VipTier[] = [
  {
    id: 0,
    name: 'Standard',
    minSlices: 0,
    feeRate: 1.0,
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)',
    iconGradient: 'from-gray-500 to-gray-700',
    benefits: [
      'Standard marketplace access',
      '1.0% transaction fee',
      'Basic support',
    ],
  },
  {
    id: 1,
    name: 'Bronze',
    minSlices: 500,
    feeRate: 0.8,
    color: '#cd7f32',
    gradient: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
    iconGradient: 'from-amber-500 to-amber-800',
    benefits: [
      '0.8% transaction fee (vs 1.0%)',
      'Access to exclusive VIP offers',
      'Priority marketplace listings',
      'Early notifications on new assets',
    ],
  },
  {
    id: 2,
    name: 'Silver',
    minSlices: 2_500,
    feeRate: 0.5,
    color: '#9ca3af',
    gradient: 'linear-gradient(135deg, #d1d5db 0%, #6b7280 100%)',
    iconGradient: 'from-gray-300 to-gray-500',
    benefits: [
      '0.5% transaction fee (vs 1.0%)',
      'All exclusive VIP offers',
      'Priority customer support',
      'Early access to new asset launches',
      'Monthly portfolio performance report',
    ],
  },
  {
    id: 3,
    name: 'Gold',
    minSlices: 10_000,
    feeRate: 0.25,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
    iconGradient: 'from-yellow-400 to-amber-600',
    benefits: [
      '0.25% transaction fee (vs 1.0%)',
      'Personal investment assistant',
      'All VIP exclusive offers',
      'Dedicated account manager',
      'Advanced analytics & reporting',
      'Quarterly strategy calls',
    ],
  },
  {
    id: 4,
    name: 'Platinum',
    minSlices: 50_000,
    feeRate: 0,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #5b21b6 100%)',
    iconGradient: 'from-violet-400 to-purple-700',
    benefits: [
      'Zero transaction fees (0%)',
      'Dedicated 24/7 personal assistant',
      'Platinum-exclusive investment deals',
      'First access to all new assets',
      'White-glove concierge service',
      'Direct line to investment team',
    ],
  },
];

function getTierForSlices(slices: number): VipTier {
  let tier = VIP_TIERS[0];
  for (const t of VIP_TIERS) {
    if (slices >= t.minSlices) tier = t;
  }
  return tier;
}

function storageKey(walletAddress: string) {
  return `spydex_vip_tier_v1_${walletAddress}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface VipContextType {
  currentTier: VipTier;
  nextTier: VipTier | null;
  isVip: boolean;
  progressToNextTier: number; // 0-100
  slicesNeededForNext: number;
}

const VipContext = createContext<VipContextType | undefined>(undefined);

export function VipProvider({ children }: { children: ReactNode }) {
  const { totalSlices } = usePortfolio();
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;

  // The highest tier ever achieved (sticky)
  const [highestTierId, setHighestTierId] = useState(0);

  // Load persisted highest tier when wallet changes
  useEffect(() => {
    if (!walletAddress) {
      setHighestTierId(0);
      return;
    }
    const saved = localStorage.getItem(storageKey(walletAddress));
    setHighestTierId(saved ? parseInt(saved, 10) : 0);
  }, [walletAddress]);

  // Ratchet up whenever totalSlices earns a higher tier
  useEffect(() => {
    if (!walletAddress) return;
    const earned = getTierForSlices(totalSlices);
    if (earned.id > highestTierId) {
      setHighestTierId(earned.id);
      localStorage.setItem(storageKey(walletAddress), String(earned.id));
    }
  }, [totalSlices, walletAddress, highestTierId]);

  // currentTier is the highest ever achieved (sticky)
  const currentTier = VIP_TIERS[highestTierId];
  const isVip = currentTier.id > 0;
  const nextTier = VIP_TIERS[currentTier.id + 1] ?? null;

  const progressToNextTier = useMemo(() => {
    if (!nextTier) return 100;
    const base = currentTier.minSlices;
    const cap = nextTier.minSlices;
    return Math.min(100, Math.max(0, ((totalSlices - base) / (cap - base)) * 100));
  }, [totalSlices, currentTier, nextTier]);

  const slicesNeededForNext = nextTier
    ? Math.max(0, nextTier.minSlices - totalSlices)
    : 0;

  return (
    <VipContext.Provider
      value={{ currentTier, nextTier, isVip, progressToNextTier, slicesNeededForNext }}
    >
      {children}
    </VipContext.Provider>
  );
}

export function useVip() {
  const ctx = useContext(VipContext);
  if (!ctx) throw new Error('useVip must be used within VipProvider');
  return ctx;
}
