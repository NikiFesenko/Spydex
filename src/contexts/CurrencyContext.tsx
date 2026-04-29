import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Currency = 'USD' | 'SOL';

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const toggleCurrency = () => setCurrency((c) => (c === 'USD' ? 'SOL' : 'USD'));
  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
