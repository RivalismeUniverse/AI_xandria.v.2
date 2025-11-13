import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBagIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { api } from '../services/api';
import { useWallet } from '../hooks/useWallet';
import PersonaCard from './PersonaCard';
import toast from 'react-hot-toast';

export default function Marketplace() {
  const { isConnected } = useWallet();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadListings();
  }, [filter]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const data = await api.getMarketplaceListings({
        sort: filter === 'price_low' ? 'price' : 'created_at',
        order: filter === 'price_high' ? 'DESC' : 'ASC'
      });
      setListings(data.listings);
    } catch (error) {
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (listingId) => {
    if (!isConnected) {
      toast.error('Please connect wallet first');
      return;
    }

    try {
      // In production: process payment first
      const mockTxHash = '0x' + Math.random().toString(16).substring(2);
      
      await api.buyListing(listingId, { payment_tx_hash: mockTxHash });
      toast.success('NFT purchased successfully!');
      loadListings();
    } catch (error) {
      toast.error('Purchase failed');
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cosmic-text text-5xl font-black mb-4"
        >
          🏪 NFT Marketplace
        </motion.h1>
        <p className="text-xl" style={{ color: '#cbd5e1' }}>
          Trade AI Personas on Somnia Blockchain
        </p>

        {/* Filters */}
        <div className="flex gap-3 mt-6">
          {['all', 'recent', 'price_low', 'price_high'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="neon-btn"
              style={{
                background: filter === f
                  ? 'linear-gradient(135deg, #ff00ff, #a020f0)'
                  : 'rgba(255, 0, 255, 0.1)',
                color: filter === f ? '#fff' : '#ff00ff',
                border: filter === f ? 'none' : '2px solid #ff00ff'
              }}
            >
              {f.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="cosmic-spinner" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBagIcon className="w-20 h-20 mx-auto mb-4 opacity-30"
                           style={{ color: '#ff00ff' }} />
            <p className="text-xl" style={{ color: '#888' }}>
              No listings available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <MarketplaceCard
                key={listing.id}
                listing={listing}
                onBuy={() => handleBuy(listing.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MarketplaceCard({ listing, onBuy }) {
  const persona = listing.persona;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="cosmic-card"
      style={{
        background: 'rgba(15, 0, 30, 0.98)',
        backdropFilter: 'blur(25px)'
      }}
    >
      {/* Persona Preview */}
      <div className="relative h-48 rounded-t-xl overflow-hidden mb-4"
           style={{ background: 'linear-gradient(135deg, #ff00ff, #a020f0)' }}>
        {persona.avatar_url ? (
          <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <SparklesIcon className="w-20 h-20 text-white opacity-50" />
          </div>
        )}

        {/* NFT Badge */}
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold"
             style={{
               background: 'linear-gradient(135deg, #ffaa00, #ff4444)',
               color: '#000'
             }}>
          NFT #{persona.nft_token_id}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="cosmic-text text-xl font-bold mb-2">
          {persona.name}
        </h3>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm" style={{ color: '#cbd5e1' }}>
            Seller: @{listing.seller?.username || 'Anonymous'}
          </span>
          <span className="text-sm font-bold" style={{ color: '#00ffff' }}>
            ELO: {persona.elo_rating}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
          <div className="text-center p-2 rounded"
               style={{ background: 'rgba(255, 0, 255, 0.1)' }}>
            <div style={{ color: '#00ffff' }}>{persona.intelligence}</div>
            <div style={{ color: '#888' }}>INT</div>
          </div>
          <div className="text-center p-2 rounded"
               style={{ background: 'rgba(255, 0, 255, 0.1)' }}>
            <div style={{ color: '#ff00ff' }}>{persona.creativity}</div>
            <div style={{ color: '#888' }}>CRE</div>
          </div>
          <div className="text-center p-2 rounded"
               style={{ background: 'rgba(255, 0, 255, 0.1)' }}>
            <div style={{ color: '#00ff00' }}>{persona.persuasiveness}</div>
            <div style={{ color: '#888' }}>PER</div>
          </div>
        </div>

        {/* Price & Buy */}
        <div className="flex items-center justify-between pt-4"
             style={{ borderTop: '1px solid rgba(255, 0, 255, 0.3)' }}>
          <div>
            <div className="text-xs" style={{ color: '#888' }}>Price</div>
            <div className="text-2xl font-bold cosmic-text">
              {listing.price} STT
            </div>
          </div>
          
          <button
            onClick={onBuy}
            className="neon-btn"
            style={{
              background: 'linear-gradient(135deg, #00ff00, #00dd00)',
              border: 'none',
              color: '#000'
            }}
          >
            <ShoppingBagIcon className="w-5 h-5 inline mr-2" />
            Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
