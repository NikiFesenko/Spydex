import { motion } from 'framer-motion';
import { Crown, Check, ChevronRight, Star, Shield, Zap, Users, Lock } from 'lucide-react';
import { useVip, VIP_TIERS } from '../../contexts/VipContext';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

interface VipTierProps {
  setActiveTab: (tab: string) => void;
}

const TIER_ICONS = [Shield, Star, Star, Crown, Crown];

const PERK_ICONS = [
  { icon: Zap, label: 'Lower Fees', desc: 'Reduced transaction fees based on your VIP tier.' },
  { icon: Star, label: 'VIP Offers', desc: 'Access exclusive investment opportunities unavailable to standard users.' },
  { icon: Users, label: 'Personal Assistant', desc: 'Dedicated support team and investment guidance at Gold & Platinum.' },
];

function TierBadge({ tierId, size = 'md' }: { tierId: number; size?: 'sm' | 'md' | 'lg' }) {
  const tier = VIP_TIERS[tierId];
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' };
  const TierIcon = TIER_ICONS[tierId];

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center shadow-lg flex-shrink-0`}
      style={{ background: tier.gradient }}
    >
      <TierIcon className="w-1/2 h-1/2 text-white" />
    </div>
  );
}

export default function VipTier({ setActiveTab }: VipTierProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { currentTier, nextTier, progressToNextTier, slicesNeededForNext, isVip } = useVip();
  const { totalSlices } = usePortfolio();

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center">
          <Crown className="w-9 h-9 text-violet-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">VIP Tier Program</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Connect your wallet to view your VIP status and unlock exclusive benefits.
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto px-2 lg:px-8 pb-10">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            VIP Tier Program
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-base sm:text-lg">
            Hold slices, unlock exclusive benefits — status is earned forever.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('marketplace')}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-emerald-600 transition-colors"
        >
          Browse VIP Offers <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Current Status Card ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10"
        style={{ background: currentTier.gradient }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <TierBadge tierId={currentTier.id} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-1">
              Current Status
            </p>
            <h3 className="text-3xl md:text-4xl font-bold text-white">
              {currentTier.name} {currentTier.id > 0 ? 'VIP' : ''}
            </h3>
            <p className="text-white/80 mt-1 text-sm">
              {totalSlices.toLocaleString()} slices held ·{' '}
              {currentTier.feeRate === 0 ? 'Zero fees' : `${currentTier.feeRate}% fee rate`}
            </p>
          </div>
          {isVip && (
            <div className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full text-white text-sm font-bold flex items-center gap-2 flex-shrink-0">
              <Crown className="w-4 h-4" /> VIP Active
            </div>
          )}
        </div>

        {/* Progress bar to next tier */}
        {nextTier && (
          <div className="relative z-10 mt-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/80 text-xs font-semibold">
                Progress to {nextTier.name}
              </span>
              <span className="text-white text-xs font-bold">
                {slicesNeededForNext.toLocaleString()} slices to go
              </span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextTier}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <p className="text-white/60 text-xs mt-2">
              Hold {nextTier.minSlices.toLocaleString()} slices to unlock{' '}
              <strong className="text-white">{nextTier.name} VIP</strong>. Status is permanent once earned.
            </p>
          </div>
        )}
        {!nextTier && (
          <div className="relative z-10 mt-6 bg-white/20 backdrop-blur-md rounded-2xl px-4 py-3 inline-flex items-center gap-2">
            <Crown className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">You've reached the highest tier!</span>
          </div>
        )}
      </motion.div>

      {/* ── VIP Perks Overview ─────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">VIP Advantages</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PERK_ICONS.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 flex flex-col gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white">{label}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── All Tiers ──────────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">All Tiers</h3>
        <div className="space-y-3">
          {VIP_TIERS.map((tier, i) => {
            const isCurrentTier = tier.id === currentTier.id;
            const isUnlocked = tier.id <= currentTier.id;
            const TierIcon = TIER_ICONS[tier.id];

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isCurrentTier
                    ? 'border-transparent shadow-lg'
                    : isUnlocked
                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40'
                }`}
                style={isCurrentTier ? { background: tier.gradient } : {}}
              >
                <div className="flex items-start gap-4 p-5 md:p-6">
                  {/* Tier badge */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}
                    style={isCurrentTier ? { background: 'rgba(255,255,255,0.2)' } : { background: tier.gradient }}
                  >
                    <TierIcon className="w-6 h-6 text-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-lg font-bold ${isCurrentTier ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {tier.name}
                      </span>
                      {isCurrentTier && (
                        <span className="bg-white/30 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          Your Tier
                        </span>
                      )}
                      {!isCurrentTier && isUnlocked && (
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                          Achieved
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {tier.minSlices.toLocaleString()} slices
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mb-3 ${isCurrentTier ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                      {tier.feeRate === 0 ? 'Zero transaction fees' : `${tier.feeRate}% transaction fee`}
                      {' · '}
                      {tier.minSlices === 0 ? 'No minimum' : `${tier.minSlices.toLocaleString()}+ slices`}
                    </p>

                    {/* Benefits */}
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                      {tier.benefits.map((b) => (
                        <li
                          key={b}
                          className={`flex items-start gap-2 text-sm ${
                            isCurrentTier ? 'text-white/90' : isUnlocked ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
                          }`}
                        >
                          <Check
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              isCurrentTier ? 'text-white' : isUnlocked ? 'text-primary' : 'text-gray-300 dark:text-gray-700'
                            }`}
                          />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      {nextTier && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Crown className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {slicesNeededForNext.toLocaleString()} more slices to {nextTier.name} VIP
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Buy more slices from the marketplace to unlock {nextTier.name} benefits — including a{' '}
              {nextTier.feeRate === 0 ? 'zero fee' : `${nextTier.feeRate}%`} transaction rate.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('marketplace')}
            className="bg-primary hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex-shrink-0"
          >
            Buy Slices
          </button>
        </motion.div>
      )}
    </div>
  );
}
