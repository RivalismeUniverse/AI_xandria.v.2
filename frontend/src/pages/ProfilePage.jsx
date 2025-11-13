import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { 
  UserCircleIcon, 
  TrophyIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';
import { api } from '../services/api';
import PersonaCard from '../components/PersonaCard';
import PersonaGenerator from '../components/PersonaGenerator';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { address, balance } = useWallet();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [myPersonas, setMyPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ username: '', email: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileData, statsData, personasData] = await Promise.all([
        api.getProfile(),
        api.getWalletStats(),
        api.getPersonas({ creator: address })
      ]);
      
      setProfile(profileData.user);
      setStats(statsData);
      setMyPersonas(personasData.personas || []);
      setEditData({
        username: profileData.user.username || '',
        email: profileData.user.email || ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await api.updateProfile(editData);
      toast.success('Profile updated!');
      setEditMode(false);
      loadProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="cosmic-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left: Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="cosmic-card"
            style={{ background: 'rgba(15, 0, 30, 0.98)' }}
          >
            <div className="text-center mb-6">
              <div className="w-32 h-32 mx-auto rounded-full mb-4 flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #ff00ff, #a020f0)' }}>
                <UserCircleIcon className="w-24 h-24 text-white" />
              </div>

              {editMode ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Username"
                    className="cosmic-input"
                  />
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email"
                    className="cosmic-input"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateProfile}
                      className="neon-btn flex-1"
                      style={{
                        background: 'linear-gradient(135deg, #00ff00, #00dd00)',
                        border: 'none',
                        color: '#000'
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="neon-btn"
                      style={{ borderColor: '#888', color: '#888' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="cosmic-text text-2xl font-bold mb-2">
                    {profile?.username || 'Anonymous'}
                  </h2>
                  <p className="text-sm mb-4" style={{ color: '#888' }}>
                    {address?.substring(0, 6)}...{address?.substring(38)}
                  </p>
                  <button
                    onClick={() => setEditMode(true)}
                    className="neon-btn"
                  >
                    Edit Profile
                  </button>
                </>
              )}
            </div>

            <div className="space-y-3 pt-4"
                 style={{ borderTop: '1px solid rgba(255, 0, 255, 0.3)' }}>
              <div className="flex justify-between">
                <span style={{ color: '#888' }}>💰 Balance</span>
                <span className="font-bold" style={{ color: '#00ff00' }}>
                  {parseFloat(balance).toFixed(4)} ETH
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#888' }}>📅 Member Since</span>
                <span className="font-semibold" style={{ color: '#cbd5e1' }}>
                  {new Date(profile?.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right: Stats Grid */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            <StatCard
              icon={<SparklesIcon className="w-8 h-8" />}
              label="Personas Created"
              value={stats?.overview.total_personas || 0}
              color="#00ffff"
            />
            <StatCard
              icon={<TrophyIcon className="w-8 h-8" />}
              label="Total Wins"
              value={stats?.overview.total_wins || 0}
              color="#ffaa00"
            />
            <StatCard
              icon={<ChartBarIcon className="w-8 h-8" />}
              label="Win Rate"
              value={`${stats?.overview.win_rate || 0}%`}
              color="#ff00ff"
            />
            <StatCard
              icon={<CurrencyDollarIcon className="w-8 h-8" />}
              label="Total Revenue"
              value={`${stats?.overview.total_revenue || 0} STT`}
              color="#00ff00"
            />
          </div>
        </div>

        {/* My Personas Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="cosmic-text text-3xl font-bold">
              My Personas
            </h2>
            <button
              onClick={() => setShowGenerator(true)}
              className="neon-btn"
              style={{
                background: 'linear-gradient(135deg, #ff00ff, #a020f0)',
                border: 'none',
                color: '#fff'
              }}
            >
              ✨ Create New Persona
            </button>
          </div>

          {myPersonas.length === 0 ? (
            <div className="text-center py-16 cosmic-card"
                 style={{ background: 'rgba(15, 0, 30, 0.98)' }}>
              <SparklesIcon className="w-20 h-20 mx-auto mb-4 opacity-30"
                           style={{ color: '#ff00ff' }} />
              <p className="text-xl mb-4" style={{ color: '#888' }}>
                You haven't created any personas yet
              </p>
              <button
                onClick={() => setShowGenerator(true)}
                className="neon-btn"
              >
                Create Your First Persona
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPersonas.map((persona, i) => (
                <motion.div
                  key={persona.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <PersonaCard persona={persona} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Top Persona */}
        {stats?.top_persona && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <h2 className="cosmic-text text-3xl font-bold mb-6">
              🏆 Top Performer
            </h2>
            <div className="cosmic-card p-6"
                 style={{ background: 'rgba(15, 0, 30, 0.98)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#00ffff' }}>
                    {stats.top_persona.name}
                  </h3>
                  <p style={{ color: '#888' }}>
                    ELO: {stats.top_persona.elo_rating} • 
                    {stats.top_persona.battles} battles • 
                    {stats.top_persona.wins} wins
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/persona/${stats.top_persona.id}`)}
                  className="neon-btn"
                >
                  View Details →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Persona Generator Modal */}
      <PersonaGenerator
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        onSuccess={() => {
          setShowGenerator(false);
          loadProfile();
        }}
      />
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="cosmic-card p-6"
      style={{ background: 'rgba(15, 0, 30, 0.98)' }}
    >
      <div className="flex items-center gap-4 mb-3">
        <div style={{ color }}>{icon}</div>
        <span className="text-sm" style={{ color: '#888' }}>
          {label}
        </span>
      </div>
      <div className="text-3xl font-bold" style={{ color }}>
        {value}
      </div>
    </motion.div>
  );
}
