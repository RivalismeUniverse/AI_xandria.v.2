import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  TrophyIcon, 
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid';
import { usePersona } from '../hooks/usePersona';
import { useWallet } from '../hooks/useWallet';
import { api } from '../services/api';
import ChatWidget from '../components/ChatWidget';
import toast from 'react-hot-toast';

export default function PersonaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();
  const { persona, loading, fetchPersona } = usePersona(id);
  
  const [stats, setStats] = useState(null);
  const [evolutionLogs, setEvolutionLogs] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      loadPersonaData();
    }
  }, [id]);

  const loadPersonaData = async () => {
    try {
      const [statsData, evolutionData] = await Promise.all([
        api.getPersonaStats(id),
        api.getPersonaAnalytics(id)
      ]);
      setStats(statsData);
      setEvolutionLogs(evolutionData || []);
    } catch (error) {
      console.error('Failed to load persona data');
    }
  };

  const handleMintNFT = async () => {
    if (!isConnected) {
      toast.error('Please connect wallet first');
      return;
    }

    if (persona.creator_id !== address) {
      toast.error('Only the creator can mint this persona');
      return;
    }

    try {
      toast.loading('Minting NFT...');
      const result = await api.mintPersonaNFT(id, 'metadata-uri');
      toast.success('NFT minted successfully!');
      fetchPersona(id);
    } catch (error) {
      toast.error('Minting failed');
    }
  };

  const handleChallenge = () => {
    if (!isConnected) {
      toast.error('Please connect wallet first');
      return;
    }
    navigate(`/battle/create?persona=${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="cosmic-spinner" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl mb-4" style={{ color: '#888' }}>
          Persona not found
        </p>
        <button onClick={() => navigate('/personas')} className="neon-btn">
          ← Back to Personas
        </button>
      </div>
    );
  }

  const winRate = stats?.battles.total > 0
    ? ((stats.battles.wins / stats.battles.total) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left: Avatar & Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="cosmic-card"
            style={{ background: 'rgba(15, 0, 30, 0.98)' }}
          >
            <div className="relative h-64 rounded-xl overflow-hidden mb-4"
                 style={{ background: 'linear-gradient(135deg, #ff00ff, #a020f0)' }}>
              {persona.avatar_url ? (
                <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <SparklesIcon className="w-32 h-32 text-white opacity-50" />
                </div>
              )}

              {/* NFT Badge */}
              {persona.is_minted && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
                     style={{
                       background: 'linear-gradient(135deg, #ffaa00, #ff4444)',
                       color: '#000'
                     }}>
                  NFT #{persona.nft_token_id}
                </div>
              )}

              {/* ELO Badge */}
              <div className="absolute bottom-4 right-4 px-4 py-2 rounded-full font-bold text-xl"
                   style={{
                     background: 'rgba(0, 0, 0, 0.7)',
                     backdropFilter: 'blur(10px)',
                     border: '1px solid rgba(255, 0, 255, 0.5)'
                   }}>
                <span className="cosmic-text">{persona.elo_rating}</span>
              </div>
            </div>

            {/* Creator Info */}
            <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255, 0, 255, 0.3)' }}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheckIcon className="w-5 h-5" style={{ color: '#00ff00' }} />
                <span className="text-sm" style={{ color: '#cbd5e1' }}>Created by</span>
              </div>
              <p className="font-bold" style={{ color: '#ff00ff' }}>
                @{persona.creator?.username || 'Anonymous'}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="space-y-3">
              <StatRow icon="⚔️" label="Battles" value={persona.total_battles} />
              <StatRow icon="🏆" label="Wins" value={persona.total_wins} />
              <StatRow icon="💬" label="Chats" value={persona.total_chats} />
              <StatRow icon="📈" label="Win Rate" value={`${winRate}%`} />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => setShowChat(true)}
                className="neon-btn w-full"
                style={{
                  background: 'linear-gradient(135deg, #ff00ff, #a020f0)',
                  border: 'none',
                  color: '#fff'
                }}
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 inline mr-2" />
                Start Chat
              </button>

              <button
                onClick={handleChallenge}
                className="neon-btn w-full"
                style={{
                  borderColor: '#ff4444',
                  color: '#ff4444',
                  background: 'rgba(255, 68, 68, 0.1)'
                }}
              >
                ⚔️ Challenge to Battle
              </button>

              {!persona.is_minted && persona.creator_id === address && (
                <button
                  onClick={handleMintNFT}
                  className="neon-btn w-full"
                  style={{
                    borderColor: '#ffaa00',
                    color: '#ffaa00',
                    background: 'rgba(255, 170, 0, 0.1)'
                  }}
                >
                  🎫 Mint as NFT
                </button>
              )}
            </div>
          </motion.div>

          {/* Right: Details */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="cosmic-text text-5xl font-black mb-4">
                {persona.name}
              </h1>

              <p className="text-xl mb-8" style={{ color: '#cbd5e1' }}>
                {persona.description}
              </p>

              {/* Tabs */}
              <div className="flex gap-4 mb-6 overflow-x-auto">
                {['overview', 'traits', 'evolution', 'stats'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-6 py-3 rounded-lg font-semibold capitalize transition-all whitespace-nowrap"
                    style={{
                      background: activeTab === tab
                        ? 'linear-gradient(135deg, #ff00ff, #a020f0)'
                        : 'rgba(255, 0, 255, 0.1)',
                      color: activeTab === tab ? '#fff' : '#ff00ff',
                      border: activeTab === tab ? 'none' : '2px solid rgba(255, 0, 255, 0.3)'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="cosmic-card p-6"
                   style={{ background: 'rgba(15, 0, 30, 0.98)', minHeight: '400px' }}>
                {activeTab === 'overview' && <OverviewTab persona={persona} />}
                {activeTab === 'traits' && <TraitsTab persona={persona} />}
                {activeTab === 'evolution' && <EvolutionTab logs={evolutionLogs} />}
                {activeTab === 'stats' && <StatsTab stats={stats} />}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      {showChat && (
        <ChatWidget
          persona={persona}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}

function StatRow({ icon, label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ color: '#888' }}>
        {icon} {label}
      </span>
      <span className="font-bold" style={{ color: '#00ffff' }}>
        {value}
      </span>
    </div>
  );
}

function OverviewTab({ persona }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-3" style={{ color: '#ff00ff' }}>
          🧠 Personality
        </h3>
        <p style={{ color: '#cbd5e1', lineHeight: 1.8 }}>
          {persona.personality}
        </p>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-3" style={{ color: '#ff00ff' }}>
          💼 Expertise
        </h3>
        <div className="flex flex-wrap gap-2">
          {persona.expertise.map((exp, i) => (
            <span
              key={i}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                background: 'rgba(255, 0, 255, 0.2)',
                border: '1px solid rgba(255, 0, 255, 0.4)',
                color: '#ff00ff'
              }}
            >
              {exp}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TraitsTab({ persona }) {
  const traits = [
    { name: 'Intelligence', value: persona.intelligence, color: '#00ffff' },
    { name: 'Creativity', value: persona.creativity, color: '#ff00ff' },
    { name: 'Persuasiveness', value: persona.persuasiveness, color: '#00ff00' }
  ];

  return (
    <div className="space-y-6">
      {traits.map((trait) => (
        <div key={trait.name}>
          <div className="flex justify-between mb-2">
            <span className="font-semibold" style={{ color: trait.color }}>
              {trait.name}
            </span>
            <span className="font-bold" style={{ color: trait.color }}>
              {trait.value}/100
            </span>
          </div>
          <div className="w-full h-4 rounded-full overflow-hidden"
               style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${trait.value}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full"
              style={{
                background: `linear-gradient(90deg, ${trait.color}, ${trait.color}aa)`,
                boxShadow: `0 0 20px ${trait.color}`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EvolutionTab({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p style={{ color: '#888' }}>No evolution history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {logs.map((log, i) => (
        <div
          key={i}
          className="p-4 rounded-lg"
          style={{
            background: 'rgba(255, 0, 255, 0.1)',
            border: '1px solid rgba(255, 0, 255, 0.3)'
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-semibold" style={{ color: '#00ffff' }}>
              {log.trait_changed}
            </span>
            <span className="text-xs" style={{ color: '#888' }}>
              {new Date(log.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: '#ff4444' }}>{log.old_value}</span>
            <span style={{ color: '#888' }}>→</span>
            <span style={{ color: '#00ff00' }}>{log.new_value}</span>
          </div>
          <p className="text-sm" style={{ color: '#cbd5e1' }}>
            {log.reason}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatsTab({ stats }) {
  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="cosmic-spinner mx-auto" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="cosmic-card p-6"
           style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
        <div className="flex items-center gap-3 mb-4">
          <TrophyIcon className="w-8 h-8" style={{ color: '#ffaa00' }} />
          <h3 className="text-xl font-bold" style={{ color: '#ffaa00' }}>
            Battle Stats
          </h3>
        </div>
        <div className="space-y-3">
          <StatRow icon="⚔️" label="Total Battles" value={stats.battles.total} />
          <StatRow icon="🏆" label="Victories" value={stats.battles.wins} />
          <StatRow icon="📊" label="Win Rate" value={`${stats.battles.winRate}%`} />
        </div>
      </div>

      <div className="cosmic-card p-6"
           style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
        <div className="flex items-center gap-3 mb-4">
          <ChartBarIcon className="w-8 h-8" style={{ color: '#00ffff' }} />
          <h3 className="text-xl font-bold" style={{ color: '#00ffff' }}>
            Engagement
          </h3>
        </div>
        <div className="space-y-3">
          <StatRow icon="💬" label="Total Chats" value={stats.chats} />
          <StatRow icon="📈" label="ELO Rating" value={stats.rating} />
          <StatRow icon="💰" label="Revenue" value={`${stats.revenue} STT`} />
        </div>
      </div>
    </div>
  );
}
