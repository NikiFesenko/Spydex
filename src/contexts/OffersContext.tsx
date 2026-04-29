import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface AssetSpec {
  label: string;
  value: string;
}

export interface Asset {
  id: string | number;
  name: string;
  type: string;
  location: string;
  price: string;
  yield: string;
  image: string;
  gallery?: string[];
  available: string;
  description: string;
  specs: AssetSpec[];
  isVip?: boolean; // VIP-exclusive offer flag
}

const defaultAssets: Asset[] = [
  {
    id: 1,
    name: 'Texas Sun Farm II',
    type: 'Solar Energy',
    location: 'Austin, TX',
    price: '$1.00',
    yield: '11.5%',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1508514177221-188b1c75eca5?q=80&w=800&auto=format&fit=crop',
    ],
    available: '450,000 Slices',
    description:
      'A 50MW operating solar farm located outside Austin, Texas. Fully contracted with a local utility under a 15-year PPA (Power Purchase Agreement), ensuring predictable cash flows.',
    specs: [
      { label: 'Capacity', value: '50 MW' },
      { label: 'PPA Duration', value: '15 Years' },
      { label: 'Tech', value: 'Monocrystalline' },
    ],
    isVip: false,
  },
  {
    id: 2,
    name: 'Logistics Hub North',
    type: 'Warehouse',
    location: 'Chicago, IL',
    price: '$1.00',
    yield: '8.2%',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8ed7e50def?q=80&w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1586528116311-ad8ed7e50def?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580674285054-bed31e145f59?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?q=80&w=800&auto=format&fit=crop',
    ],
    available: '120,000 Slices',
    description:
      'Premium Grade-A logistics facility featuring 32ft clear heights and 120 dock doors. Fully leased to a Fortune 500 e-commerce tenant on a triple-net basis.',
    specs: [
      { label: 'Asset Class', value: 'Industrial' },
      { label: 'Occupancy', value: '100%' },
      { label: 'Lease Term', value: '7 Years left' },
    ],
    isVip: false,
  },
  {
    id: 3,
    name: 'Manhattan Residence Tower',
    type: 'Real Estate',
    location: 'New York, NY',
    price: '$1.00',
    yield: '7.8%',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800&auto=format&fit=crop',
    ],
    available: '200,000 Slices',
    description:
      'A premium 42-story residential tower in midtown Manhattan featuring 320 luxury apartments. Stabilized at 97% occupancy with long-term institutional tenants. Professionally managed by a top-tier property management firm.',
    specs: [
      { label: 'Asset Class', value: 'Residential' },
      { label: 'Occupancy', value: '97%' },
      { label: 'Stories', value: '42 Floors' },
    ],
    isVip: false,
  },
  {
    id: 4,
    name: 'Nevada Solar Reserve',
    type: 'Solar Energy',
    location: 'Las Vegas, NV',
    price: '$1.00',
    yield: '13.2%',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800&auto=format&fit=crop',
    ],
    available: '800,000 Slices',
    description:
      'A utility-scale 120MW solar reserve in the Nevada desert with battery storage integration. Supplies clean energy to 45,000 homes under a 20-year state-backed contract.',
    specs: [
      { label: 'Capacity', value: '120 MW' },
      { label: 'Storage', value: '200 MWh Battery' },
      { label: 'Contract', value: '20 Years' },
    ],
    isVip: false,
  },
  {
    id: 5,
    name: 'Miami Beachfront Estate',
    type: 'Real Estate',
    location: 'Miami Beach, FL',
    price: '$1.00',
    yield: '9.4%',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=800&auto=format&fit=crop',
    ],
    available: '75,000 Slices',
    description:
      'Iconic oceanfront estate with direct beach access spanning 8,200 sqft. Premium short-term rental property generating exceptional seasonal income in one of Florida\'s most sought-after zip codes.',
    specs: [
      { label: 'Size', value: '8,200 sqft' },
      { label: 'Bedrooms', value: '7 BR / 8 BA' },
      { label: 'Strategy', value: 'Luxury STR' },
    ],
    isVip: false,
  },
  // ─── VIP-Exclusive Offers ─────────────────────────────────────────────────
  {
    id: 6,
    name: 'Apex Solar Megapark — VIP',
    type: 'Solar Energy',
    location: 'Phoenix, AZ',
    price: '$1.00',
    yield: '15.8%',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop',
    ],
    available: '50,000 Slices',
    description:
      'An exclusive 300MW solar megapark available only to VIP tier holders. Privately negotiated premium yield with guaranteed off-take agreements from Fortune 100 energy buyers. Maximum 50,000 slices available — strictly limited.',
    specs: [
      { label: 'Capacity', value: '300 MW' },
      { label: 'Access', value: 'VIP Only' },
      { label: 'Off-take', value: 'Fortune 100' },
    ],
    isVip: true,
  },
  {
    id: 7,
    name: 'Aspen Mountain Lodge — VIP',
    type: 'Real Estate',
    location: 'Aspen, CO',
    price: '$1.00',
    yield: '12.1%',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800&auto=format&fit=crop',
    ],
    available: '30,000 Slices',
    description:
      'Ultra-premium ski-in/ski-out mountain lodge in world-famous Aspen. This 14,000 sqft property commands top rental rates during peak seasons, exclusively available to VIP members. Fractional ownership with annual stay credits included.',
    specs: [
      { label: 'Size', value: '14,000 sqft' },
      { label: 'Access', value: 'VIP Only' },
      { label: 'Perk', value: 'Stay Credits' },
    ],
    isVip: true,
  },
];

interface OffersContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id'>) => void;
}

const OffersContext = createContext<OffersContextType | undefined>(undefined);

export function OffersProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('spydex_custom_offers_web3');
    if (saved) {
      return [...defaultAssets, ...JSON.parse(saved)];
    }
    return defaultAssets;
  });

  const addAsset = (newAssetData: Omit<Asset, 'id'>) => {
    const newAsset = { ...newAssetData, id: Date.now().toString() };

    setAssets((prev) => {
      const updated = [...prev, newAsset];
      const customAssets = updated.filter((a) => typeof a.id === 'string');
      localStorage.setItem('spydex_custom_offers_web3', JSON.stringify(customAssets));
      return updated;
    });
  };

  return (
    <OffersContext.Provider value={{ assets, addAsset }}>
      {children}
    </OffersContext.Provider>
  );
}

export function useOffers() {
  const context = useContext(OffersContext);
  if (context === undefined) {
    throw new Error('useOffers must be used within an OffersProvider');
  }
  return context;
}
