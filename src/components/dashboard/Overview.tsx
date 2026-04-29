import { ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Overview({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 py-8 sm:py-12 md:py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Streaming Live on Solana
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white"
        >
          Passive income from <br className="hidden md:block" />
          <span className="text-gradient">real world assets</span>.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto pt-2 px-2"
        >
          Buy slices of yield-generating properties like Solar Farms and Warehouses. 
          Earn 7-12% APY streamed directly to your account.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-6"
        >
          <button 
            onClick={() => setActiveTab('marketplace')}
            className="bg-primary hover:bg-emerald-600 text-white px-8 py-3.5 rounded-full font-medium shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-[2px]"
          >
            Explore Assets
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-12 md:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass dark:bg-gray-800/80 dark:border-gray-700 p-8 rounded-3xl text-center md:text-left card-gradient"
        >
          <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-600">
            <Zap className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Streaming Yield</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Rent and power sales are collected and continuously streamed to slice holders securely on-chain.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass dark:bg-gray-800/80 dark:border-gray-700 p-8 rounded-3xl text-center md:text-left card-gradient"
        >
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0 text-primary shadow-sm border border-primary/10">
            <ArrowUpRight className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Instant Liquidity</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Don't wait for buyers. Use our Instant Sell feature to seamlessly swap your slices for cash at any time.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass dark:bg-gray-800/80 dark:border-gray-700 p-8 rounded-3xl text-center md:text-left card-gradient"
        >
          <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-600">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Trusted & Verified</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Real-world data and pricing is powered by Decentralized Oracles to ensure absolute transparent truth.</p>
        </motion.div>
      </div>
    </div>
  );
}
