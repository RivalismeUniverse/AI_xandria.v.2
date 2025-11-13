import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/solid';

export default function Navbar() {
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const navigate = useNavigate();

  const formatAddress = (addr) => {
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 p-4"
         style={{
           background: 'rgba(0, 0, 0, 0.5)',
           backdropFilter: 'blur(20px)',
           borderBottom: '1px solid rgba(255, 0, 255, 0.3)'
         }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <SparklesIcon className="w-10 h-10" style={{ color: '#ff00ff' }} />
          </motion.div>
          <h1 className="cosmic-text text-2xl font-black">
            AI_XANDRIA
          </h1>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/personas">🎭 Personas</NavLink>
          <NavLink to="/battle">⚔️ Battle Arena</NavLink>
          <NavLink to="/marketplace">🏪 Marketplace</NavLink>
        </div>

        {/* Wallet Section */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="neon-btn flex items-center gap-2"
                style={{
                  borderColor: '#00ff00',
                  color: '#00ff00',
                  background: 'rgba(0, 255, 0, 0.1)'
                }}
              >
                <UserCircleIcon className="w-5 h-5" />
                <span className="hidden sm:inline">{formatAddress(address)}</span>
              </button>
              <button
                onClick={disconnectWallet}
                className="neon-btn"
                style={{
                  borderColor: '#ff4444',
                  color: '#ff4444',
                  background: 'rgba(255, 68, 68, 0.1)'
                }}
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="neon-btn"
            >
              {isConnecting ? '⏳ Connecting...' : '🔗 Connect Wallet'}
            </button>
          )}

          <a
            href="https://somnia.network"
            target="_blank"
            rel="noopener noreferrer"
            className="neon-btn hidden sm:flex"
            style={{
              borderColor: '#00ffff',
              color: '#00ffff',
              background: 'rgba(0, 255, 255, 0.1)'
            }}
          >
            🌐 Somnia
          </a>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-sm font-semibold transition-all hover:scale-105"
      style={{ color: '#cbd5e1' }}
      onMouseOver={(e) => e.currentTarget.style.color = '#ff00ff'}
      onMouseOut={(e) => e.currentTarget.style.color = '#cbd5e1'}
    >
      {children}
    </Link>
  );
}
