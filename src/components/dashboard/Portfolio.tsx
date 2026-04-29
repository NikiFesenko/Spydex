import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useVip } from '../../contexts/VipContext';
import type { Asset } from '../../contexts/OffersContext';
import { Wallet, TrendingUp, Layers, BarChart3, PackageOpen, Crown, ChevronRight } from 'lucide-react';

interface PortfolioProps {
  onSellSlice?: (asset: Asset) => void;
  setActiveTab?: (tab: string) => void;
}

export default function Portfolio({ onSellSlice, setActiveTab }: PortfolioProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { holdings, totalSlices, totalValueUsd, avgYield } = usePortfolio();
  const { currentTier, nextTier, progressToNextTier, slicesNeededForNext } = useVip();

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet className="w-9 h-9 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connect your wallet</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Connect your Solana wallet to see your slice holdings and yield.
          </p>
        </div>
        <button
          onClick={() => setVisible(true)}
          className="bg-primary hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-medium transition-all shadow-sm hover:shadow-md transform hover:-translate-y-[1px]"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // ── No holdings yet ────────────────────────────────────────────────────────
  if (holdings.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto px-2 lg:px-8">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Your Portfolio
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-base sm:text-lg">
            Track your streaming yields and holdings.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center gap-6 bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-100 dark:border-gray-700">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700/60 flex items-center justify-center">
            <PackageOpen className="w-9 h-9 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No slices yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              Head to the Marketplace and buy your first slices — they'll show up here instantly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Real holdings ──────────────────────────────────────────────────────────
  // Simulated yield: 1% of total value (demo)
  const totalYieldEarned = totalValueUsd * 0.01;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto px-2 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Your Portfolio
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-base sm:text-lg">
            Track your streaming yields and holdings.
          </p>
        </div>
      {/* VIP Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={{ background: currentTier.gradient }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">VIP Status</p>
            <p className="text-white font-bold text-xl">{currentTier.name}{currentTier.id > 0 ? ' VIP' : ''}</p>
            {nextTier && (
              <div className="mt-2">
                <div className="flex justify-between text-white/70 text-xs mb-1">
                  <span>Progress to {nextTier.name}</span>
                  <span>{slicesNeededForNext.toLocaleString()} slices to go</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNextTier}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            )}
            {!nextTier && (
              <p className="text-white/70 text-xs mt-1">Maximum tier achieved 🎉</p>
            )}
          </div>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('vip')}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-full transition-colors flex-shrink-0"
            >
              Benefits <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      <button className="bg-primary hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-medium transition-all shadow-sm hover:shadow-md transform hover:-translate-y-[1px]">
          Claim Yield (${totalYieldEarned.toFixed(2)})
        </button>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass dark:bg-gray-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 card-gradient border border-gray-100 dark:border-gray-700"
      >
        <div className="grid grid-cols-3 gap-4 sm:gap-8 md:gap-12 divide-x divide-gray-200 dark:divide-gray-700">
          <div className="pl-0 sm:pl-4">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 sm:mb-2 uppercase tracking-wide">
              <BarChart3 className="w-3.5 h-3.5 hidden sm:block" />
              Total Value
            </div>
            <div className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              ${totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="pl-3 sm:pl-8 md:pl-12">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 sm:mb-2 uppercase tracking-wide">
              <Layers className="w-3.5 h-3.5 hidden sm:block" />
              Slices
            </div>
            <div className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              {totalSlices.toLocaleString()}
            </div>
          </div>
          <div className="pl-3 sm:pl-8 md:pl-12">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 sm:mb-2 uppercase tracking-wide">
              <TrendingUp className="w-3.5 h-3.5 hidden sm:block" />
              Avg Yield
            </div>
            <div className="text-2xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight">
              {avgYield.toFixed(1)}%
            </div>
          </div>
        </div>
      </motion.div>

      {/* Holdings list */}
      <div className="space-y-6 pt-2">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Your Assets</h3>

        {holdings.map((holding, i) => {
          const positionValue = holding.slices * holding.pricePerSlice;
          const yieldEarned = positionValue * 0.01; // 1% demo yield

          // Build a minimal Asset object for the sell flow
          const assetForSell: Asset = {
            id: holding.assetId,
            name: holding.assetName,
            type: holding.assetType,
            location: '',
            price: `$${holding.pricePerSlice.toFixed(2)}`,
            yield: holding.assetYield,
            image: holding.assetImage,
            available: `${holding.slices} Slices`,
            description: '',
            specs: [],
          };

          return (
            <motion.div
              key={`${holding.assetId}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass bg-white dark:bg-gray-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow border border-transparent dark:border-gray-700"
            >
              {/* Left: Image + name */}
              <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto flex-1 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 shadow-sm">
                  <img
                    src={holding.assetImage}
                    className="w-full h-full object-cover"
                    alt={holding.assetName}
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                    {holding.assetName}
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mt-0.5 text-sm sm:text-base">
                    {holding.slices.toLocaleString()} Slices
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {holding.assetType} · {holding.assetYield} APY
                  </p>
                </div>
              </div>

              {/* Right: stats + sell */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-8">
                <div className="text-right">
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Position Value</div>
                  <div className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">
                    ${positionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Yield Earned</div>
                  <div className="font-bold text-primary text-base sm:text-xl">+${yieldEarned.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => onSellSlice && onSellSlice(assetForSell)}
                  className="border border-gray-200 dark:border-gray-600 hover:border-red-200 dark:hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm outline-none flex-shrink-0"
                >
                  Sell
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
