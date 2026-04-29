import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Shield, CreditCard, Wallet, FileText, ChevronRight, AlertTriangle, ExternalLink } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import type { Asset } from '../../contexts/OffersContext';
import PriceDisplay from '../ui/PriceDisplay';
import { useSpydexProgram } from '../../hooks/useSpydexProgram';

interface CheckoutProps {
  asset: Asset;
  onCancel: () => void;
  flowType?: 'buy' | 'sell';
}

export default function Checkout({ asset, onCancel, flowType = 'buy' }: CheckoutProps) {
  const { connected } = useWallet();
  const { buySlice } = useSpydexProgram();
  const [activeTab, setActiveTab] = useState<'price' | 'payment' | 'agreements'>('price');
  
  // Tab 1 State
  const [sliceCount, setSliceCount] = useState<number | string>(1);
  const parsedAvailable = parseInt((asset?.available || '').toString().replace(/\D/g, ''), 10) || Infinity;
  const numSliceCount = typeof sliceCount === 'number' ? sliceCount : parseInt(sliceCount as string, 10) || 1;
  const isExceeding = numSliceCount > parsedAvailable;

  const slicePriceVal = parseFloat((asset?.price || '0').toString().replace(/[^0-9.-]+/g, "")) || 0;
  const totalPrice = (numSliceCount * slicePriceVal).toFixed(2);

  
  // Tab 2 State
  const [selectedPayment, setSelectedPayment] = useState<'wallet' | 'card' | null>(connected ? 'wallet' : null);

  // Tab 3 State
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedRisks, setAgreedRisks] = useState(false);

  // Success & Error State
  const [isSuccess, setIsSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (activeTab === 'price') setActiveTab('payment');
    else if (activeTab === 'payment') setActiveTab('agreements');
    else if (activeTab === 'agreements') {
      if (agreedTerms && agreedRisks) {
        setTxError(null);
        setIsProcessing(true);
        try {
          if (selectedPayment === 'wallet') {
            // ✅ Real on-chain transaction via Phantom
            const sig = await buySlice(numSliceCount);
            setTxSignature(sig);
          }
          setIsProcessing(false);
          setIsSuccess(true);
        } catch (err: any) {
          setIsProcessing(false);
          const msg = err?.message || String(err);
          if (msg.includes('User rejected') || msg.includes('rejected')) {
            setTxError('Transaction cancelled — you rejected the Phantom request.');
          } else if (msg.includes('custom program error: 0x1770')) {
            setTxError('Not enough slices available on-chain.');
          } else if (msg.includes('insufficient funds') || msg.includes('0x1')) {
            setTxError('Insufficient SOL balance. Please airdrop devnet SOL first.');
          } else {
            setTxError(`Transaction failed: ${msg.slice(0, 120)}`);
          }
        }
      }
    }
  };

  if (isSuccess) {
    const solscanUrl = txSignature
      ? `https://solscan.io/tx/${txSignature}?cluster=devnet`
      : null;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          {flowType === 'sell' ? 'Sale Successful!' : 'Purchase Successful!'}
        </h2>
        <p className="text-lg text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
          You have successfully {flowType === 'sell' ? 'sold' : 'purchased'} {numSliceCount} {numSliceCount === 1 ? 'slice' : 'slices'} of {asset.name}.
        </p>
        {solscanUrl && (
          <a
            href={solscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:text-emerald-400 transition-colors font-medium mb-8 group"
          >
            <span className="text-sm font-mono truncate max-w-[260px]">{txSignature?.slice(0, 16)}...{txSignature?.slice(-8)}</span>
            <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm">View on Solscan</span>
          </a>
        )}
        <button
          onClick={onCancel}
          className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold py-3 px-8 rounded-full transition-all shadow-lg hover:-translate-y-0.5"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <button 
        onClick={onCancel}
        className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Asset
      </button>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {flowType === 'sell' ? 'Sell Asset' : 'Checkout'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Complete your {flowType === 'sell' ? 'sale' : 'purchase'} of {asset.name}
        </p>
      </div>

      <div className="flex flex-col-reverse lg:flex-row gap-6 lg:gap-8">
        
        {/* Left Column: Progress & Tabs */}
        <div className="lg:w-2/3 space-y-4 sm:space-y-6">
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between p-1 bg-gray-100 dark:bg-gray-800/50 rounded-2xl w-full">
            {[
              { id: 'price', label: '1. Details' },
              { id: 'payment', label: '2. Payment' },
              { id: 'agreements', label: '3. Agreements' }
            ].map((step) => (
              <div
                key={step.id}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  activeTab === step.id 
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {step.label}
              </div>
            ))}
          </div>

          {/* Dynamic Tab Content */}
          <div className="bg-white dark:bg-gray-800/80 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-3xl p-6 sm:p-8 shadow-sm">
            <AnimatePresence mode="wait">
              
              {/* Tab 1: Price & Details */}
              {activeTab === 'price' && (
                <motion.div
                  key="price"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> {flowType === 'sell' ? 'Sale Details' : 'Purchase Details'}
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600 dark:text-gray-400">Price per Slice</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{asset.price}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mt-4">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Number of Slices</span>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setSliceCount(Math.max(1, numSliceCount - 1))}
                          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shrink-0"
                        >-</button>
                        <input
                          type="number"
                          value={sliceCount}
                          onChange={(e) => setSliceCount(e.target.value)}
                          className="w-16 font-bold text-lg text-center text-gray-900 dark:text-white bg-transparent outline-none focus:ring-0"
                          min="1"
                        />
                        <button 
                          onClick={() => setSliceCount(numSliceCount + 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shrink-0"
                        >+</button>
                      </div>
                    </div>
                    {isExceeding && (
                      <p className="text-red-500 text-sm mt-2 text-right">
                        Amount exceeds {flowType === 'sell' ? 'your owned slices' : 'circulating supply'}. Max: {parsedAvailable}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Tab 2: Payment Method */}
              {activeTab === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" /> Select Payment Method
                  </h2>
                  <div className="grid gap-4">
                    <button
                      onClick={() => setSelectedPayment('wallet')}
                      className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                        selectedPayment === 'wallet' 
                          ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${selectedPayment === 'wallet' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                          <Wallet className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-gray-900 dark:text-white">Solana Wallet</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Pay with USDC or SOL</div>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPayment === 'wallet' ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                        {selectedPayment === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedPayment('card')}
                      className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                        selectedPayment === 'card' 
                          ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${selectedPayment === 'card' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-gray-900 dark:text-white">Credit Card (Fiat)</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{flowType === 'sell' ? 'Receive via Stripe' : 'Pay via Stripe Checkout'}</div>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPayment === 'card' ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                        {selectedPayment === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Tab 3: Agreements */}
              {activeTab === 'agreements' && (
                <motion.div
                  key="agreements"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" /> Policy Agreements
                  </h2>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300/80">
                      Investing in Real World Assets involves risk. Values can go down as well as up. Please ensure you understand the legal framework.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-start gap-4 cursor-pointer p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="mt-1">
                        <input 
                          type="checkbox" 
                          checked={agreedTerms}
                          onChange={(e) => setAgreedTerms(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 cursor-pointer accent-primary" 
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Terms of Protocol</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">I have read and agree to the Spydex Marketplace Terms of Service and Privacy Policy.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 cursor-pointer p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="mt-1">
                        <input 
                          type="checkbox" 
                          checked={agreedRisks}
                          onChange={(e) => setAgreedRisks(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 cursor-pointer accent-primary" 
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Risk Disclosure</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">I understand that these asset slices are tokenized derivatives and acknowledge the associated financial risks.</div>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white dark:bg-gray-800/80 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm lg:sticky lg:top-24">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Order Summary</h3>
            
            <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{asset.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{asset.type}</div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Yield (APY)</span>
                <span className="font-semibold text-primary">{asset.yield}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{numSliceCount}x Slice</span>
                <PriceDisplay usdAmount={parseFloat(totalPrice)} priceClassName="font-medium text-sm" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Network Fee</span>
                <span className="font-medium text-gray-900 dark:text-white">~$0.02</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mb-8">
              <div className="flex justify-between items-end">
                <span className="font-medium text-gray-900 dark:text-white">
                  {flowType === 'sell' ? 'You Receive' : 'Total'}
                </span>
                <PriceDisplay
                  usdAmount={flowType === 'sell' ? parseFloat(totalPrice) - 0.02 : parseFloat(totalPrice) + 0.02}
                  priceClassName="text-2xl font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={(activeTab === 'price' && isExceeding) || (activeTab === 'payment' && !selectedPayment) || (activeTab === 'agreements' && (!agreedTerms || !agreedRisks)) || isProcessing}
              className="w-full bg-primary hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {isProcessing
                ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Waiting for Phantom...
                  </span>
                )
                : (activeTab === 'agreements' ? (flowType === 'sell' ? 'Confirm Sale' : 'Confirm Purchase') : 'Continue')
              }
              {!isProcessing && activeTab !== 'agreements' && <ChevronRight className="w-5 h-5" />}
            </button>

            {/* Transaction error banner */}
            {txError && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{txError}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
