import { } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useSolPrice } from '../../hooks/useSolPrice';

interface PriceDisplayProps {
  /** USD dollar amount as a number, e.g. 1.00 */
  usdAmount: number;
  /** Extra classes for the wrapper */
  className?: string;
  /** Text size class for the price itself */
  priceClassName?: string;
}

/**
 * Renders a price with a small USD/SOL toggle pill above it.
 *
 * Usage:
 *   <PriceDisplay usdAmount={1.00} priceClassName="text-3xl font-bold" />
 */
export default function PriceDisplay({ usdAmount, className = '', priceClassName = 'text-lg font-bold' }: PriceDisplayProps) {
  const { currency, toggleCurrency } = useCurrency();
  const { toSol, loading } = useSolPrice();

  const displayValue = (() => {
    if (currency === 'SOL') {
      const sol = toSol(usdAmount);
      if (loading) return '…';
      if (sol === null) return '—';
      // Show 4 decimal places for small SOL amounts, 2 for larger ones
      return sol < 0.01 ? `◎ ${sol.toFixed(6)}` : `◎ ${sol.toFixed(4)}`;
    }
    return `$${usdAmount.toFixed(2)}`;
  })();

  return (
    <div className={`inline-flex flex-col items-start gap-0.5 ${className}`}>
      {/* Toggle pill */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleCurrency(); }}
        title={currency === 'USD' ? 'Switch to SOL' : 'Switch to USD'}
        className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold leading-none transition-all duration-200 select-none
          bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400
          hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary"
      >
        <span className={currency === 'USD' ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}>USD</span>
        <span className="mx-0.5 opacity-40">·</span>
        <span className={currency === 'SOL' ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}>SOL</span>
      </button>

      {/* Price value */}
      <span className={`text-gray-900 dark:text-white tabular-nums tracking-tight transition-all duration-200 ${priceClassName}`}>
        {displayValue}
      </span>
    </div>
  );
}
