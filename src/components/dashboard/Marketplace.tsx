import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, MapPin, Plus, Crown, Sun, Building2, LayoutGrid, Lock } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useOffers } from '../../contexts/OffersContext';
import type { Asset } from '../../contexts/OffersContext';
import { useVip } from '../../contexts/VipContext';
import PriceDisplay from '../ui/PriceDisplay';
import AssetChart from '../ui/AssetChart';

type FilterId = 'all' | 'solar' | 'realestate' | 'vip';

const FILTERS: { id: FilterId; label: string; icon: React.ElementType }[] = [
  { id: 'all',        label: 'All Offers',    icon: LayoutGrid },
  { id: 'solar',      label: 'Solar Panels',  icon: Sun        },
  { id: 'realestate', label: 'Real Estate',   icon: Building2  },
  { id: 'vip',        label: 'VIP Offers',    icon: Crown      },
];

function matchesFilter(asset: Asset, filter: FilterId): boolean {
  if (filter === 'all') return true;
  if (filter === 'vip') return !!asset.isVip;
  if (filter === 'solar') return asset.type === 'Solar Energy';
  if (filter === 'realestate')
    return asset.type === 'Real Estate' || asset.type === 'Warehouse';
  return true;
}

interface MarketplaceProps {
  onBuySlice?: (asset: Asset) => void;
}

export default function Marketplace({ onBuySlice }: MarketplaceProps) {
  const { assets, addAsset } = useOffers();
  const { connected, publicKey } = useWallet();
  const { isVip } = useVip();

  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Real Estate',
    location: '',
    price: '$1.00',
    yield: '',
    available: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1541888031317-1db7d8e85eb6?q=80&w=800&auto=format&fit=crop',
    gallery: ''
  });

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedGallery = formData.gallery.trim()
      ? formData.gallery.split(',').map(url => url.trim()).filter(url => url.length > 0)
      : [];

    const finalGallery = parsedGallery.length > 0 ? parsedGallery : [formData.image];
    if (finalGallery[0] !== formData.image) {
      finalGallery.unshift(formData.image);
    }

    addAsset({
      ...formData,
      gallery: finalGallery,
      specs: [
        { label: 'Category', value: formData.type },
        { label: 'Listed By', value: publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 'Wallet' }
      ]
    });
    setShowCreateModal(false);
    setFormData({
      name: '', type: 'Real Estate', location: '', price: '$1.00', yield: '', available: '', description: '', image: 'https://images.unsplash.com/photo-1541888031317-1db7d8e85eb6?q=80&w=800&auto=format&fit=crop', gallery: ''
    });
  };

  const filteredAssets = assets.filter((a) => matchesFilter(a, activeFilter));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 px-2 lg:px-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Marketplace</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-base sm:text-lg">Invest in premium real world assets starting at $1.</p>
        </div>

        {connected && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-emerald-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Place Offer
          </button>
        )}
      </div>

      {/* ── Filter / Sort Bar ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map(({ id, label, icon: Icon }) => {
          const isActive = activeFilter === id;
          const isVipFilter = id === 'vip';
          return (
            <button
              key={id}
              onClick={() => setActiveFilter(id)}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border',
                isActive
                  ? isVipFilter
                    ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                    : 'bg-primary border-primary text-white shadow-md'
                  : isVipFilter
                  ? 'border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" />
              {label}
              {isVipFilter && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                }`}>
                  {assets.filter((a) => a.isVip).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {filteredAssets.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-24 text-center gap-4 bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <LayoutGrid className="w-7 h-7 text-gray-400" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white mb-1">No offers found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Try a different filter category.</p>
            </div>
          </div>
        )}
        {filteredAssets.map((asset, i) => {
          const isLocked = asset.isVip && !isVip;
          return (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => { if (!isLocked) { setSelectedAsset(asset); setActiveImage(asset.image); } }}
            className={`group glass dark:bg-gray-800/80 dark:border-gray-700 rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-white flex flex-col h-full ${
              isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
            }`}
          >
            <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden flex-shrink-0">
              <img
                src={asset.image}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isLocked ? 'grayscale' : 'group-hover:scale-105'
                }`}
                alt={asset.name}
              />

              {/* Category pill */}
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-sm transition-colors">
                {asset.type}
              </div>

              {/* VIP badge */}
              {asset.isVip && (
                <div className={`absolute top-4 right-4 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md ${
                  isVip
                    ? 'bg-violet-600 text-white'
                    : 'bg-black/60 text-white'
                }`}>
                  {isLocked ? <Lock className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                  {isLocked ? 'VIP Locked' : 'VIP Exclusive'}
                </div>
              )}

              {/* Photo count badge (non-VIP-flagged) */}
              {!asset.isVip && asset.gallery && asset.gallery.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm flex items-center gap-1">
                  +{asset.gallery.length - 1} Photos
                </div>
              )}

              {/* Locked overlay */}
              {isLocked && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white text-xs font-semibold text-center px-4">Reach Bronze VIP (500 slices) to unlock</p>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 lg:p-8 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white max-w-[180px] sm:max-w-[200px] truncate">{asset.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {asset.location}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Annual Yield</div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary mt-1">{asset.yield}</div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex items-center justify-between py-5 border-t border-b border-gray-100 dark:border-gray-700/50 mb-6 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl px-4">
                  <PriceDisplay
                    usdAmount={parseFloat((asset.price || '0').replace(/[^0-9.-]+/g, '')) || 0}
                    priceClassName="font-bold text-lg"
                  />
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Available</div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">{asset.available}</div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLocked) { setSelectedAsset(asset); setActiveImage(asset.image); }
                  }}
                  disabled={isLocked}
                  className={`w-full font-medium py-3.5 rounded-xl transition-all shadow-md outline-none ${
                    isLocked
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {isLocked ? 'VIP Required' : 'View Details'}
                </button>
              </div>
            </div>
          </motion.div>
          );
        })}
      </div>

      {/* Create Offer Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-[10%] md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[101] w-auto md:w-[600px] max-h-[85vh] bg-white dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl overflow-y-auto no-scrollbar p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Place New Offer</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOffer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Name</label>
                  <input required value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200" placeholder="e.g. Green Valley Farm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    <select value={formData.type} onChange={e => setFormData(f => ({ ...f, type: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all duration-200">
                      <option>Real Estate</option>
                      <option>Solar Energy</option>
                      <option>Warehouse</option>
                      <option>Artwork</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                    <input required value={formData.location} onChange={e => setFormData(f => ({ ...f, location: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200" placeholder="City, State" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slice Price</label>
                    <input required value={formData.price} onChange={e => setFormData(f => ({ ...f, price: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200" placeholder="$1.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yield (APY)</label>
                    <input required value={formData.yield} onChange={e => setFormData(f => ({ ...f, yield: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200" placeholder="8.5%" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available</label>
                    <input required value={formData.available} onChange={e => setFormData(f => ({ ...f, available: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200" placeholder="10,000 Slices" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-primary">Cover Image URL</label>
                  <input required value={formData.image} onChange={e => setFormData(f => ({ ...f, image: e.target.value }))} className="w-full px-4 py-2 border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-900/10 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all duration-200" placeholder="https://..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Gallery URLs (Comma separated)</label>
                  <input value={formData.gallery} onChange={e => setFormData(f => ({ ...f, gallery: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all duration-200 text-sm" placeholder="https://image1.jpg, https://image2.jpg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea required rows={3} value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200" placeholder="Describe the asset..." />
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-primary hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md transform hover:-translate-y-0.5 outline-none focus:ring-4 focus:ring-primary/20">
                    Submit Offer
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Asset Details Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAsset(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%', scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: '100%', scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[101] w-full md:w-[600px] lg:w-[800px] max-h-[90vh] bg-white dark:bg-gray-900/95 backdrop-blur-xl rounded-t-3xl md:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-y-auto no-scrollbar flex flex-col"
            >
              <div className="relative h-64 md:h-80 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={activeImage || selectedAsset.image}
                    alt={selectedAsset.name}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                <button
                  onClick={() => setSelectedAsset(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-2 rounded-full text-sm font-semibold text-gray-900 dark:text-white shadow-lg z-10">
                  {selectedAsset.type}
                </div>
              </div>

              <div className="p-6 md:p-8 flex-1 overflow-y-auto no-scrollbar">

                {/* Image Gallery Thumbnails */}
                {selectedAsset.gallery && selectedAsset.gallery.length > 1 && (
                  <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar pb-2 pt-1 border-b border-gray-100 dark:border-gray-800">
                    {selectedAsset.gallery.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(imgUrl)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 outline-none ${activeImage === imgUrl ? 'border-primary shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                          }`}
                      >
                        <img src={imgUrl} className="w-full h-full object-cover" alt={`gallery thumbnail ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                )}

                  <div className="flex flex-col sm:flex-row justify-between items-start mb-6 sm:mb-8 gap-3 mt-2">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{selectedAsset.name}</h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {selectedAsset.location}
                    </p>
                  </div>
                    <div className="bg-primary/10 dark:bg-primary/20 px-4 py-3 sm:px-6 sm:py-4 rounded-2xl sm:text-right w-full sm:w-auto">
                    <div className="text-sm font-semibold text-primary uppercase tracking-wider">Annual Yield</div>
                    <div className="text-3xl sm:text-4xl font-bold text-primary mt-1">{selectedAsset.yield}</div>
                  </div>
                </div>

                {/* Value Projection Chart */}
                <div className="mb-8">
                  <AssetChart
                    priceUsd={parseFloat((selectedAsset.price || '0').replace(/[^0-9.-]+/g, '')) || 1}
                    apyStr={selectedAsset.yield || '0%'}
                  />
                </div>

                <div className="prose dark:prose-invert max-w-none mb-8">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Info className="w-5 h-5 text-primary" /> About this Asset
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                    {selectedAsset.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                  {selectedAsset.specs?.map((spec, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">{spec.label}</div>
                      <div className="text-sm md:text-base font-bold text-gray-900 dark:text-white">{spec.value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-8 border border-gray-100 dark:border-gray-700">
                  <div>
                    <PriceDisplay
                      usdAmount={parseFloat((selectedAsset.price || '0').replace(/[^0-9.-]+/g, '')) || 0}
                      priceClassName="font-bold text-3xl"
                    />
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Available to Buy</div>
                    <div className="font-bold text-gray-900 dark:text-white text-xl">{selectedAsset.available}</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (onBuySlice && selectedAsset) {
                        onBuySlice(selectedAsset);
                      }
                    }}
                    className="flex-1 bg-primary hover:bg-emerald-600 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg"
                  >
                    Buy Slices Now
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
