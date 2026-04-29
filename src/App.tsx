import { useState, useMemo, useEffect, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

import Navbar from './components/layout/Navbar';
import Overview from './components/dashboard/Overview';
import Marketplace from './components/dashboard/Marketplace';
import Portfolio from './components/dashboard/Portfolio';
import Checkout from './components/dashboard/Checkout';
import VipTier from './components/dashboard/VipTier';
import IntroAnimation from './components/layout/IntroAnimation';
import { OffersProvider } from './contexts/OffersContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { VipProvider } from './contexts/VipContext';
import type { Asset } from './contexts/OffersContext';
import './App.css';

// ─── Valid top-level tabs ─────────────────────────────────────────────────────
type Tab = 'overview' | 'marketplace' | 'portfolio' | 'checkout' | 'vip';
const VALID_TABS: Tab[] = ['overview', 'marketplace', 'portfolio', 'checkout', 'vip'];

function getTabFromUrl(): Tab {
  const hash = window.location.hash.replace('#', '') as Tab;
  return VALID_TABS.includes(hash) ? hash : 'marketplace';
}

export default function App() {
  const [activeTab, setActiveTabState] = useState<Tab>(getTabFromUrl);
  const [checkoutAsset, setCheckoutAsset] = useState<Asset | null>(null);
  const [checkoutFlow, setCheckoutFlow] = useState<'buy' | 'sell'>('buy');
  const [showIntro, setShowIntro] = useState(true);

  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  // ── Push a hash-based history entry when tab changes ──────────────────────
  const setActiveTab = useCallback((tab: string) => {
    const t = tab as Tab;
    if (window.location.hash !== `#${t}`) {
      window.history.pushState({ tab: t }, '', `#${t}`);
    }
    setActiveTabState(t);
  }, []);

  // ── Listen for the browser back/forward button ────────────────────────────
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const tab: Tab = (e.state?.tab as Tab) ?? getTabFromUrl();
      // If going back from checkout, don't leave the user stranded
      if (tab === 'checkout' && !checkoutAsset) {
        const fallback: Tab = checkoutFlow === 'sell' ? 'portfolio' : 'marketplace';
        window.history.replaceState({ tab: fallback }, '', `#${fallback}`);
        setActiveTabState(fallback);
      } else {
        setActiveTabState(tab);
      }
    };

    window.addEventListener('popstate', onPopState);
    // Seed the current entry so the very first back-press works
    if (!window.history.state?.tab) {
      window.history.replaceState({ tab: activeTab }, '', `#${activeTab}`);
    }
    return () => window.removeEventListener('popstate', onPopState);
  }, [activeTab, checkoutAsset, checkoutFlow]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <CurrencyProvider>
            <OffersProvider>
              <PortfolioProvider>
                <VipProvider>
                  {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
                  <div className="min-h-screen bg-gray-50 dark:bg-[#050C10] text-gray-900 dark:text-gray-100 font-sans selection:bg-primary/20 selection:text-primary transition-colors duration-200 pb-20 md:pb-0">
                    <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
                    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 w-full">
                      {activeTab === 'overview' && <Overview setActiveTab={setActiveTab} />}
                      {activeTab === 'marketplace' && (
                        <Marketplace
                          onBuySlice={(asset) => {
                            setCheckoutAsset(asset);
                            setCheckoutFlow('buy');
                            setActiveTab('checkout');
                          }}
                        />
                      )}
                      {activeTab === 'checkout' && checkoutAsset && (
                        <Checkout
                          asset={checkoutAsset}
                          flowType={checkoutFlow}
                          onCancel={() => setActiveTab(checkoutFlow === 'sell' ? 'portfolio' : 'marketplace')}
                        />
                      )}
                      {activeTab === 'portfolio' && (
                        <Portfolio
                          onSellSlice={(asset) => {
                            setCheckoutAsset(asset);
                            setCheckoutFlow('sell');
                            setActiveTab('checkout');
                          }}
                          setActiveTab={setActiveTab}
                        />
                      )}
                      {activeTab === 'vip' && <VipTier setActiveTab={setActiveTab} />}
                    </main>
                  </div>
                </VipProvider>
              </PortfolioProvider>
            </OffersProvider>
          </CurrencyProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
