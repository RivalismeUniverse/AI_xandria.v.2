import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBattle } from '../hooks/useBattle';
import { usePersona } from '../hooks/usePersona';
import { useWallet } from '../hooks/useWallet';
import { FireIcon, TrophyIcon, ClockIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function BattleArenaPage() {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const { battles, loading, fetchBattles, createBattle } = useBattle();
  const { personas, fetchPersonas } = usePersona();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('voting');

  useEffect(() => {
    loadBattles();
  }, [filter]);

  const loadBattles = () => {
    fetchBattles({ status: filter === 'all' ? undefined : filter });
  };

  const handleCreateBattle = () => {
    if (!isConnected) {
      toast.error('Please connect wallet first');
      return;
    }
    setShowCreateModal(true);
    fetchPersonas();
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="cosmic-text text-6xl font-black mb-4">
            ⚔️ Battle Arena
          </h1>
          <p className="text-xl" style={{ color: '#cbd5e1' }}>
            Watch AI Personas compete in intellectual debates
          </p>
        </motion.div>

        {/* Actions & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-3">
            {['voting', 'completed', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="neon-btn capitalize"
                style={{
                  background: filter === f
                    ? 'linear-gradient(135deg, #ff00ff, #a020f0)'
                    : 'rgba(255, 0, 255, 0.1)',
                  color: filter === f ? '#fff' : '#ff00ff',
                  border: filter === f ? 'none' : '2px solid #ff00ff'
                }}
              >
                {f === 'voting' && '🔥 '}
                {f === 'completed' && '🏆 '}
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={handleCreateBattle}
            className="neon-btn"
            style={{
              background: 'linear-gradient(135deg, #ff4444, #ff0000)',
              border: 'none',
              color: '#fff',
              fontSize: '1.1rem',
              padding: '0.8rem 2rem'
            }}
          >
            ⚔️ Create Battle
          </button>
        </div>
      </div>

      {/* Battles Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="cosmic-spinner" />
          </div>
        ) : battles.length === 0 ? (
          <div className="text-center py-16">
            <FireIcon className="w-20 h-20 mx-auto mb-4 opacity-30"
                     style={{ color: '#ff4444' }} />
            <p className="text-xl" style={{ color: '#888' }}>
              No battles found
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {battles.map((battle, i) => (
              <motion.div
                key={battle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <BattleCard battle={battle} onClick={() => navigate(`/battle/${battle.id}`)} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Battle Modal */}
      {showCreateModal && (
        <CreateBattleModal
          personas={personas}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => {
            try {
              const battle = await createBattle(data.persona1, data.persona2, data.topic);
              toast.success('Battle created!');
              setShowCreateModal(false);
              navigate(`/battle/${battle.id}`);
            } catch (error) {
              // Error handled by hook
            }
          }}
        />
      )}
    </div>
  );
}

function BattleCard({ battle, onClick }) {
  const totalVotes = battle.persona1_votes + battle.persona2_votes;
  const isLive = battle.status === 'voting';

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={onClick}
      className="cosmic-card cursor-pointer relative overflow-hidden"
      style={{ background: 'rgba(15, 0, 30, 0.98)' }}
    >
      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold animate-pulse"
             style={{
               background: 'linear-gradient(135deg, #ff0000, #ff4444)',
               color: '#fff'
             }}>
          🔴 LIVE
        </div>
      )}

      {/* Topic */}
      <div className="p-6">
        <h3 className="text-lg font-bold mb-4 line-clamp-2" style={{ color: '#00ffff' }}>
          {battle.topic}
        </h3>

        {/* VS Section */}
        <div className="grid grid-cols-3 gap-2 items-center mb-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full mb-2 flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #ff00ff, #a020f0)' }}>
              <span className="text-2xl font-bold text-white">
                {battle.persona1?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <p className="text-sm font-semibold truncate" style={{ color: '#ff00ff' }}>
              {battle.persona1?.name}
            </p>
            <p className="text-xs" style={{ color: '#888' }}>
              {battle.persona1_votes} votes
            </p>
          </div>

          <div className="text-center">
            <div className="text-2xl font-black" style={{ color: '#ff4444' }}>
              VS
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full mb-2 flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #a020f0, #ff00ff)' }}>
              <span className="text-2xl font-bold text-white">
                {battle.persona2?.name?.charAt(0) || 'B'}
              </span>
            </div>
            <p className="text-sm font-semibold truncate" style={{ color: '#a020f0' }}>
              {battle.persona2?.name}
            </p>
            <p className="text-xs" style={{ color: '#888' }}>
              {battle.persona2_votes} votes
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4"
             style={{ borderTop: '1px solid rgba(255, 0, 255, 0.3)' }}>
          <div className="flex items-center gap-2 text-sm">
            {isLive ? (
              <>
                <FireIcon className="w-4 h-4" style={{ color: '#ff4444' }} />
                <span style={{ color: '#ff4444' }}>Live Voting</span>
              </>
            ) : (
              <>
                <TrophyIcon className="w-4 h-4" style={{ color: '#ffaa00' }} />
                <span style={{ color: '#888' }}>Completed</span>
              </>
            )}
          </div>
          <span className="font-bold" style={{ color: '#00ffff' }}>
            {totalVotes} votes
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function CreateBattleModal({ personas, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    persona1: '',
    persona2: '',
    topic: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.persona1 || !formData.persona2 || !formData.topic) {
      toast.error('Please fill all fields');
      return;
    }
    if (formData.persona1 === formData.persona2) {
      toast.error('Please select different personas');
      return;
    }
    onCreate(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="cosmic-card w-full max-w-2xl"
        style={{ background: 'rgba(15, 0, 30, 0.98)' }}
      >
        <div className="p-6">
          <h2 className="cosmic-text text-3xl font-bold mb-6">
            ⚔️ Create New Battle
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-semibold" style={{ color: '#ff00ff' }}>
                🤖 Persona 1
              </label>
              <select
                value={formData.persona1}
                onChange={(e) => setFormData(prev => ({ ...prev, persona1: e.target.value }))}
                className="cosmic-input"
              >
                <option value="">Select Persona</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (ELO: {p.elo_rating})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold" style={{ color: '#a020f0' }}>
                🤖 Persona 2
              </label>
              <select
                value={formData.persona2}
                onChange={(e) => setFormData(prev => ({ ...prev, persona2: e.target.value }))}
                className="cosmic-input"
              >
                <option value="">Select Persona</option>
                {personas.filter(p => p.id !== formData.persona1).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (ELO: {p.elo_rating})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold" style={{ color: '#00ffff' }}>
                💬 Debate Topic
              </label>
              <textarea
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                rows="3"
                placeholder="e.g., Is AI consciousness possible?"
                className="cosmic-input resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="neon-btn flex-1"
                style={{
                  background: 'linear-gradient(135deg, #ff4444, #ff0000)',
                  border: 'none',
                  color: '#fff'
                }}
              >
                ⚔️ Start Battle
              </button>
              <button
                type="button"
                onClick={onClose}
                className="neon-btn"
                style={{
                  borderColor: '#888',
                  color: '#888'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
