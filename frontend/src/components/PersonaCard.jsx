import { motion } from 'framer-motion';
import { SparklesIcon, TrophyIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function PersonaCard({ persona }) {
  const navigate = useNavigate();

  const winRate = persona.total_battles > 0
    ? ((persona.total_wins / persona.total_battles) * 100).toFixed(1)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="cosmic-card cursor-pointer"
      onClick={() => navigate(`/persona/${persona.id}`)}
      style={{
        background: 'rgba(15, 0, 30, 0.98)',
        backdropFilter: 'blur(25px)',
        overflow: 'hidden'
      }}
    >
      {/* Avatar Section */}
      <div className="relative h-48 rounded-t-xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, #ff00ff 0%, #a020f0 100%)'
      }}>
        {persona.avatar_url ? (
          <img 
            src={persona.avatar_url} 
            alt={persona.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <SparklesIcon className="w-20 h-20 text-white opacity-50" />
          </div>
        )}
        
        {/* NFT Badge */}
        {persona.is_minted && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
               style={{
                 background: 'linear-gradient(135deg, #ffaa00 0%, #ff4444 100%)',
                 color: '#000'
               }}>
            <SparklesIcon className="w-4 h-4" />
            NFT
          </div>
        )}
        
        {/* ELO Badge */}
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full font-bold"
             style={{
               background: 'rgba(0, 0, 0, 0.7)',
               backdropFilter: 'blur(10px)',
               border: '1px solid rgba(255, 0, 255, 0.5)'
             }}>
          <span className="cosmic-text text-lg">{persona.elo_rating}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Name & Creator */}
        <div className="mb-3">
          <h3 className="text-xl font-bold mb-1 cosmic-text">
            {persona.name}
          </h3>
          <p className="text-sm" style={{ color: '#cbd5e1' }}>
            by @{persona.creator?.username || 'Anonymous'}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm mb-4 line-clamp-2" style={{ color: '#cbd5e1' }}>
          {persona.description || persona.personality}
        </p>

        {/* Traits */}
        <div className="mb-4 space-y-2">
          <TraitBar 
            label="Intelligence" 
            value={persona.intelligence} 
            color="#00ffff"
          />
          <TraitBar 
            label="Creativity" 
            value={persona.creativity} 
            color="#ff00ff"
          />
          <TraitBar 
            label="Persuasiveness" 
            value={persona.persuasiveness} 
            color="#00ff00"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4"
             style={{ borderTop: '1px solid rgba(255, 0, 255, 0.3)' }}>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1" style={{ color: '#ffaa00' }}>
              <TrophyIcon className="w-4 h-4" />
              <span className="font-semibold">{winRate}%</span>
            </div>
            <div style={{ color: '#888' }}>
              {persona.total_battles} battles
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/battle/create?persona=${persona.id}`);
            }}
            className="flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #ff00ff, #a020f0)',
              color: '#fff',
              border: 'none'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            ⚔️ Challenge
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/chat/${persona.id}`);
            }}
            className="flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-1"
            style={{
              background: 'rgba(255, 0, 255, 0.1)',
              border: '2px solid #ff00ff',
              color: '#ff00ff'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#ff00ff';
              e.currentTarget.style.color = '#000';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 0, 255, 0.1)';
              e.currentTarget.style.color = '#ff00ff';
            }}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TraitBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: '#cbd5e1' }}>
        <span>{label}</span>
        <span className="font-semibold">{value}/100</span>
      </div>
      <div className="w-full rounded-full h-2 overflow-hidden"
           style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
            boxShadow: `0 0 10px ${color}`
          }}
        />
      </div>
    </div>
  );
}
