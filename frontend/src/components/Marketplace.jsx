import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '../hooks/useWallet'
import { ShoppingCart, Coins, TrendingUp, Users } from 'lucide-react'

const Marketplace = () => {
  const { isConnected, connectWallet } = useWallet()
  const [nfts, setNfts] = useState([])
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('price')

  // Mock data - in real app, this would come from blockchain
  const mockNFTs = [
    {
      id: 1,
      name: "■ EINSTEIN",
      description: "Genius physicist AI persona",
      image: "https://api.dicebear.com/7.x/bottts/svg?seed=einstein",
      price: "0.5",
      currency: "STT",
      seller: "0x1234...5678",
      traits: ["Intelligence: 95", "Creativity: 88", "Wisdom: 92"],
      battles: 45,
      wins: 38,
      rating: 4.8
    },
    {
      id: 2,
      name: "■ SOLARA",
      description: "Healing and spiritual AI guide",
      image: "https://api.dicebear.com/7.x/bottts/svg?seed=solara",
      price: "0.3",
      currency: "STT",
      seller: "0x8765...4321",
      traits: ["Empathy: 98", "Wisdom: 85", "Creativity: 90"],
      battles: 32,
      wins: 25,
      rating: 4.6
    }
  ]

  useEffect(() => {
    setNfts(mockNFTs)
  }, [])

  const handlePurchase = async (nft) => {
    if (!isConnected) {
      await connectWallet()
      return
    }
    
    // In real implementation, this would call smart contract
    alert(`Purchasing ${nft.name} for ${nft.price} ${nft.currency}`)
  }

  const filteredNFTs = nfts.filter(nft => {
    if (filter === 'all') return true
    if (filter === 'high-rated') return nft.rating >= 4.5
    if (filter === 'battle-proven') return nft.battles > 20
    return true
  })

  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    if (sortBy === 'price') return parseFloat(a.price) - parseFloat(b.price)
    if (sortBy === 'rating') return b.rating - a.rating
    if (sortBy === 'battles') return b.battles - a.battles
    return 0
  })

  return (
    <div className="marketplace-container" style={{ padding: 'var(--space-xl)' }}>
      <div className="marketplace-header text-center mb-8">
        <h1 className="neon-title">🛒 MARKETPLACE</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          Buy and sell AI personas as NFTs on Somnia blockchain
        </p>
      </div>

      {/* Stats */}
      <div className="marketplace-stats" style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)'
      }}>
        <div className="stat-card card text-center">
          <Coins size={24} style={{ color: 'var(--neon-yellow)', marginBottom: 'var(--space-sm)' }} />
          <h3 style={{ color: 'var(--neon-cyan)', margin: 0 }}>124</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>NFTs Listed</p>
        </div>
        <div className="stat-card card text-center">
          <TrendingUp size={24} style={{ color: 'var(--neon-green)', marginBottom: 'var(--space-sm)' }} />
          <h3 style={{ color: 'var(--neon-cyan)', margin: 0 }}>47.2K</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>STT Volume</p>
        </div>
        <div className="stat-card card text-center">
          <Users size={24} style={{ color: 'var(--neon-purple)', marginBottom: 'var(--space-sm)' }} />
          <h3 style={{ color: 'var(--neon-cyan)', margin: 0 }}>892</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Active Traders</p>
        </div>
        <div className="stat-card card text-center">
          <ShoppingCart size={24} style={{ color: 'var(--neon-pink)', marginBottom: 'var(--space-sm)' }} />
          <h3 style={{ color: 'var(--neon-cyan)', margin: 0 }}>56</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Sales Today</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters card" style={{ 
        display: 'flex',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap'
      }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--dark-bg)',
            border: '1px solid var(--dark-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-primary)'
          }}
        >
          <option value="all">All NFTs</option>
          <option value="high-rated">High Rated (4.5+)</option>
          <option value="battle-proven">Battle Proven</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--dark-bg)',
            border: '1px solid var(--dark-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-primary)'
          }}
        >
          <option value="price">Price: Low to High</option>
          <option value="rating">Highest Rated</option>
          <option value="battles">Most Battles</option>
        </select>
      </div>

      {/* NFT Grid */}
      <div className="nfts-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 'var(--space-lg)'
      }}>
        {sortedNFTs.map((nft) => (
          <motion.div
            key={nft.id}
            className="nft-card card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="nft-image" style={{
              width: '100%',
              height: '200px',
              background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-md)'
            }}>
              <img 
                src={nft.image} 
                alt={nft.name}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: 'var(--radius-full)',
                  border: '3px solid white'
                }}
              />
            </div>

            <h4 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--space-xs)' }}>
              {nft.name}
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
              {nft.description}
            </p>

            <div className="nft-stats" style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-md)',
              fontSize: '0.8rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>
                ⚔️ {nft.battles} battles
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                🏆 {nft.wins} wins
              </span>
              <span style={{ color: 'var(--neon-yellow)' }}>
                ⭐ {nft.rating}
              </span>
            </div>

            <div className="nft-traits" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-xs)',
              marginBottom: 'var(--space-md)'
            }}>
              {nft.traits.slice(0, 2).map((trait, index) => (
                <span 
                  key={index}
                  style={{
                    background: 'rgba(0, 255, 255, 0.1)',
                    border: '1px solid var(--neon-cyan)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem',
                    color: 'var(--neon-cyan)'
                  }}
                >
                  {trait}
                </span>
              ))}
            </div>

            <div className="nft-price" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-md)'
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Price</div>
                <div style={{ color: 'var(--neon-green)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {nft.price} {nft.currency}
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => handlePurchase(nft)}
              >
                <ShoppingCart size={16} style={{ marginRight: 'var(--space-xs)' }} />
                Buy Now
              </button>
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'center' }}>
              Seller: {nft.seller}
            </div>
          </motion.div>
        ))}
      </div>

      {sortedNFTs.length === 0 && (
        <div className="text-center" style={{ color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>
          <ShoppingCart size={64} style={{ opacity: 0.5, marginBottom: 'var(--space-md)' }} />
          <p>No NFTs found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default Marketplace
