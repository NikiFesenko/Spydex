import { useState, useEffect } from 'react';

const CACHE_KEY = 'spydex_sol_price';
const CACHE_TTL_MS = 60_000; // 1 minute

export function useSolPrice() {
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { price, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          setSolPrice(price);
          setLoading(false);
          return;
        }
      }
    } catch (_) {}

    // Fetch fresh price from CoinGecko public API
    let cancelled = false;
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const price = data?.solana?.usd as number;
        if (price) {
          setSolPrice(price);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ price, timestamp: Date.now() }));
        }
      })
      .catch(() => {
        // Fallback to cached stale price if fetch fails
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) setSolPrice(JSON.parse(cached).price);
        } catch (_) {}
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  /**
   * Convert a USD value to SOL. Returns null while price is loading.
   */
  function toSol(usdAmount: number): number | null {
    if (!solPrice) return null;
    return usdAmount / solPrice;
  }

  return { solPrice, toSol, loading };
}
