import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, PieChart, Store, Moon, Sun, Menu, X, Wallet, LogOut } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode: () => setIsDarkMode((v) => !v) };
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: PieChart },
  { id: 'marketplace', label: 'Marketplace', icon: Store },
  { id: 'portfolio', label: 'Portfolio', icon: Building2 },
];

export default function Navbar({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setDrawerOpen(false);
  };

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <>
      {/* ─── Top Navbar ─────────────────────────────────────────────── */}
      <nav className="glass dark:bg-gray-900/80 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Left: Hamburger (mobile) + Logo */}
            <div className="flex items-center gap-3">
              {/* Hamburger — mobile only */}
              <button
                className="md:hidden p-2 -ml-1 rounded-xl text-gray-500 dark:text-gray-400
                           hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Logo */}
              <button
                onClick={() => handleTabChange('overview')}
                className="flex flex-col items-center leading-none select-none"
                aria-label="Go to overview"
              >
                {/* Symbol: — ∧ — */}
                <span
                  className="flex items-center gap-[0.3rem] text-gray-900 dark:text-white"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 300 }}
                >
                  <span style={{ fontSize: '0.85rem' }}>—</span>
                  <span style={{ fontSize: '1.15rem' }}>∧</span>
                  <span style={{ fontSize: '0.85rem' }}>—</span>
                </span>
                {/* Name: ESTANTO */}
                <span
                  className="text-gray-900 dark:text-white hidden sm:block"
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                    fontWeight: 300,
                    fontSize: '0.52rem',
                    letterSpacing: '0.38em',
                    marginTop: '1px',
                    paddingLeft: '0.38em',
                  }}
                >
                  ESTANTO
                </span>
              </button>

              {/* Desktop tab links */}
              <div className="hidden md:flex ml-6 space-x-8">
                {tabs.map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleTabChange(id)}
                      className={cn(
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'border-primary text-black dark:text-white'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 mr-2', isActive ? 'text-primary' : 'text-gray-400')} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Dark mode + Wallet (desktop) */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400
                           hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Wallet — desktop only */}
              <div className="hidden sm:flex items-center gap-3">
                {connected ? (
                  <>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300
                                    bg-gray-100/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-full
                                    border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                      {publicKey?.toBase58().slice(0, 4)}…{publicKey?.toBase58().slice(-4)}
                    </div>
                    <button
                      onClick={disconnect}
                      className="text-sm font-medium text-gray-500 dark:text-gray-400
                                 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setVisible(true)}
                    className="bg-primary hover:bg-emerald-600 text-white px-5 py-2 rounded-full
                               text-sm font-medium transition-all shadow-sm hover:shadow-md
                               transform hover:-translate-y-[1px]"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Mobile Slide-in Drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer panel */}
            <motion.aside
              key="drawer-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 z-[70] w-[78vw] max-w-[320px] md:hidden
                         flex flex-col bg-white dark:bg-gray-900 shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4
                              border-b border-gray-100 dark:border-gray-800">
                <button
                  className="flex items-center gap-2"
                  onClick={() => handleTabChange('overview')}
                >
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center
                                  text-white font-bold text-lg shadow-md">
                    N
                  </div>
                  <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">
                    Neighborhood
                  </span>
                </button>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                             transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400
                              dark:text-gray-600 px-3 mb-3">
                  Navigation
                </p>
                {tabs.map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleTabChange(id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      <span className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                        isActive
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      )}>
                        <Icon className="w-4.5 h-4.5" />
                      </span>
                      {label}
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Drawer footer — wallet section */}
              <div className="px-4 pb-8 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold
                             text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center
                                   justify-center shrink-0 text-gray-500 dark:text-gray-400">
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </span>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>

                {connected ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50
                                    dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                      <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center
                                       justify-center shrink-0 text-primary">
                        <Wallet className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Connected wallet</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {publicKey?.toBase58().slice(0, 6)}…{publicKey?.toBase58().slice(-6)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { disconnect(); setDrawerOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold
                                 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center
                                       justify-center shrink-0">
                        <LogOut className="w-4 h-4" />
                      </span>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setVisible(true); setDrawerOpen(false); }}
                    className="w-full bg-primary hover:bg-emerald-600 text-white font-semibold py-3.5
                               rounded-2xl text-sm transition-all shadow-md"
                  >
                    Sign In with Wallet
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Mobile Bottom Tab Bar ───────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50
                      bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
                      border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-around px-2 py-1.5">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-all duration-200 flex-1',
                  isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                )}
              >
                {/* Active pill background */}
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                )}
                <Icon className={cn(
                  'w-5 h-5 transition-all relative z-10',
                  isActive && 'scale-110'
                )} />
                <span className="text-[10px] font-semibold tracking-wide relative z-10">
                  {label === 'Marketplace' ? 'Market' : label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
