import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Sword, Star, Users } from 'lucide-react'

const PersonaCard = ({ persona, onChat, onBattle, onViewDetails }) => {
  return (
    <motion.div 
      className="persona-card card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <div className="persona-card-header" style={{ 
        background: `linear-gradient(135deg, ${persona.color || '#667eea'} 0%, #764ba2 100%)` 
      }}>
        <div className="persona-avatar">
          {persona.avatarUrl ? (
            <img src={persona.avatarUrl} alt={persona.name} />
          ) : (
            <div className="avatar-placeholder">
              {persona.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="persona-badge">
          {persona.category === 'academic' ? '🎓' : '🎨'}
        </div>
      </div>

      <div className="persona-card-body">
        <h3 className="persona-name" style={{ color: 'var(--neon-cyan)' }}>
          {persona.name}
        </h3>
        <p className="persona-tagline" style={{ color: 'var(--text-secondary)' }}>
          {persona.tagline}
        </p>
        <p className="persona-description" style={{ color: 'var(--text-muted)' }}>
          {persona.description}
        </p>

        <div className="persona-stats">
          <div className="stat">
            <Star size={16} style={{ color: 'var(--neon-yellow)' }} />
            <span className="stat-value">{persona.rating || '4.5'}</span>
          </div>
          <div className="stat">
            <Users size={16} style={{ color: 'var(--neon-cyan)' }} />
            <span className="stat-value">{persona.users || '1.2K'}</span>
          </div>
          <div className="stat">
            <Sword size={16} style={{ color: 'var(--neon-pink)' }} />
            <span className="stat-value">{persona.battles || '45'}</span>
          </div>
        </div>

        <div className="persona-traits-mini">
          {persona.traits?.slice(0, 3).map((trait, index) => (
            <span key={index} className="mini-trait">
              {trait}
            </span>
          ))}
        </div>
      </div>

      <div className="persona-card-footer">
        <div className="persona-price">
          <span className="price-label">Unlock for</span>
          <span className="price-value" style={{ color: 'var(--neon-green)' }}>
            {persona.price || '5 STT'}
          </span>
        </div>
        
        <div className="persona-actions">
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => onChat(persona)}
            style={{ marginRight: 'var(--space-xs)' }}
          >
            <MessageCircle size={16} />
            Chat
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => onBattle(persona)}
          >
            <Sword size={16} />
            Battle
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default PersonaCard
