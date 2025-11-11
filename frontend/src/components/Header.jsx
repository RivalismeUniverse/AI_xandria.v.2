import React from 'react'
import { useWallet } from '../hooks/useWallet'
import { Wallet, Home, Sparkles, Sword, ShoppingCart, GalleryVertical } from 'lucide-react'

const Header = ({ currentView, onNavigate }) => {
  const { isConnected, connectWallet, disconnectWallet, walletAddress } = useWallet()

  const navItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'generate', label: 'Create', icon: Sparkles },
    { id: 'gallery', label: 'Gallery', icon: GalleryVertical },
    { id: 'battle', label: 'Battle', icon: Sword },
    { id: 'marketplace', label: 'Market', icon: ShoppingCart }
  ]

  const shortenedAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : ''

  return (
    <header style={{
      background: 'rgba(10, 10, 10, 0.95)',
      backdropFilter: 'blur(15px)',
      borderBottom: '3px solid var(--neon-pink)',
      padding: 'var(--space-md) var(--space-lg)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-nav)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Logo */}
        <div 
          className="logo"
          onClick={() => onNavigate('landing')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--gradient-primary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            AI
          </div>
          <h1 style={{ 
            color: 'var(--neon-cyan)',
            margin: 0,
            fontSize: '1.5rem',
            background: 'var(--gradient-primary)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            XANDRIA
          </h1>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  background: isActive ? 'var(--neon-pink)' : 'transparent',
                  color: isActive ? 'var(--dark-bg)' : 'var(--text-primary)',
                  border: `2px solid ${isActive ? 'var(--neon-pink)' : 'var(--dark-border)'}`,
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  fontFamily: 'var(--font-primary)',
                  fontWeight: '600',
                  transition: 'all var(--transition-normal)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.background = 'rgba(255, 20, 147, 0.2)'
                    e.target.style.borderColor = 'var(--neon-pink)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.background = 'transparent'
                    e.target.style.borderColor = 'var(--dark-border)'
                  }
                }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Wallet Connection */}
        <div>
          {isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{
                background: 'rgba(0, 255, 0, 0.1)',
                border: '1px solid var(--neon-green)',
                padding: 'var(--space-sm) var(--space-md)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--neon-green)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                fontSize: '0.9rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: 'var(--neon-green)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
                {shortenedAddress}
              </div>
              <button
                onClick={disconnectWallet}
                style={{
                  background: 'rgba(255, 20, 147, 0.2)',
                  border: '1px solid var(--neon-pink)',
                  color: 'var(--neon-pink)',
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '0.8rem'
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              style={{
                background: 'rgba(0, 255, 255, 0.1)',
                border: '2px solid var(--neon-cyan)',
                color: 'var(--neon-cyan)',
                padding: 'var(--space-sm) var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontFamily: 'var(--font-primary)',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                transition: 'all var(--transition-normal)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--neon-cyan)'
                e.target.style.color = 'var(--dark-bg)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(0, 255, 255, 0.1)'
                e.target.style.color = 'var(--neon-cyan)'
              }}
            >
              <Wallet size={16} />
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
