import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import PersonaGenerator from '../components/PersonaGenerator';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export default function HomePage() {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const [showGenerator, setShowGenerator] = useState(false);
  const [stats, setStats] = useState({
    total_personas: 156,
    total_battles: 112,
    active_creators: 34,
    platform_revenue: 52.7
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getPlatformStats();
      setStats(data);
    } catch (error) {
      // Use default stats if API fails
    }
  };

  const handleGeneratePersona = () => {
    if (!isConnected) {
      toast.error('Please connect wallet first');
      return;
    }
    setShowGenerator(true);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto text-center mb-20">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="cosmic-text text-6xl md:text-8xl font-black mb-6"
          style={{ lineHeight: 1.2 }}
        >
          AI_XANDRIA
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl md:text-3xl mb-8"
          style={{ color: '#cbd5e1' }}
        >
          Persona Economy on Somnia Blockchain
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg md:text-xl mb-12 max-w-3xl mx-auto"
          style={{ color: '#888' }}
        >
          Create, Own, and Monetize AI Personas. Powered by Amazon Bedrock & AWS Free Tier.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <button
            onClick={handleGeneratePersona}
            className="neon-btn text-lg px-8 py-4"
            style={{
              background: 'linear-gradient(135deg, #ff00ff, #a020f0)',
              border: 'none',
              color: '#fff'
            }}
          >
            🤖 Generate Persona
          </button>

          <button
            onClick={() => navigate('/personas')}
            className="neon-btn text-lg px-8 py-4"
          >
            🏛️ View All Personas
          </button>

          <button
            onClick={() => navigate('/battle')}
            className="neon-btn text-lg px-8 py-4"
            style={{
              borderColor: '#ff4444',
              color: '#ff4444',
              background: 'rgba(255, 68, 68, 0.1)'
            }}
          >
            ⚔️ Battle Arena
          </button>

          <button
            onClick={() => navigate('/marketplace')}
            className="neon-btn text-lg px-8 py-4"
            style={{
              borderColor: '#ffaa00',
              color: '#ffaa00',
              background: 'rgba(255, 170, 0, 0.1)'
            }}
          >
            🏪 Marketplace
          </button>
        </motion.div>
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
      >
        <StatCard
          icon="🤖"
          value={stats.total_personas}
          label="Personas Created"
          color="#00ffff"
        />
        <StatCard
          icon="⚔️"
          value={stats.total_battles}
          label="Battles Fought"
          color="#ff00ff"
        />
        <StatCard
          icon="👥"
          value={stats.active_creators}
          label="Active Creators"
          color="#00ff00"
        />
        <StatCard
          icon="💰"
          value={`${stats.platform_revenue} STT`}
          label="Creator Revenue"
          color="#ffaa00"
        />
      </motion.div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        <FeatureCard
          icon="🔐"
          title="True Ownership"
          description="NFT-based ownership on Somnia blockchain. Your persona, your asset."
          color="#ff00ff"
        />
        <FeatureCard
          icon="💸"
          title="Built-in Monetization"
          description="80% revenue share from chat sessions. Earn while you sleep."
          color="#00ff00"
        />
        <FeatureCard
          icon="⚔️"
          title="Objective Evaluation"
          description="Battle Arena for transparent, community-driven quality metrics."
          color="#00ffff"
        />
      </div>

      {/* Persona Generator Modal */}
      <PersonaGenerator
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        onSuccess={(persona) => {
          toast.success(`${persona.name} created!`);
          navigate(`/persona/${persona.id}`);
        }}
      />
    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="cosmic-card text-center p-6"
      style={{ background: 'rgba(15, 0, 30, 0.98)' }}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-3xl font-bold mb-2" style={{ color }}>
        {value}
      </div>
      <div className="text-sm" style={{ color: '#888' }}>
        {label}
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, description, color }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="cosmic-card p-6"
      style={{ background: 'rgba(15, 0, 30, 0.98)' }}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3" style={{ color }}>
        {title}
      </h3>
      <p style={{ color: '#cbd5e1' }}>
        {description}
      </p>
    </motion.div>
  );
}
