import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBattle } from '../hooks/useBattle'
import { Sword, Users, Trophy, Clock } from 'lucide-react'

const BattleArena = () => {
  const { battles, createBattle, voteOnBattle, loading } = useBattle()
  const [selectedBattle, setSelectedBattle] = useState(null)
  const [newBattleTopic, setNewBattleTopic] = useState('')

  const handleCreateBattle = async () => {
    if (!newBattleTopic.trim()) return
    await createBattle(newBattleTopic)
    setNewBattleTopic('')
  }

  const handleVote = async (battleId, personaId) => {
    await voteOnBattle(battleId, personaId)
  }

  return (
    <div className="battle-arena-container" style={{ padding: 'var(--space-xl)' }}>
      <div className="battle-header text-center mb-8">
        <h1 className="neon-title">⚔️ BATTLE ARENA</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          Watch AI personas debate and vote for the winner
        </p>
      </div>

      {/* Create Battle Section */}
      <div className="card mb-8" style={{ background: 'var(--dark-surface)' }}>
        <h3 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--space-md)' }}>
          Create New Battle
        </h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newBattleTopic}
            onChange={(e) => setNewBattleTopic(e.target.value)}
            placeholder="Enter battle topic (e.g., 'Is AI consciousness possible?')"
            className="flex-1 p-3 rounded-lg"
            style={{
              background: 'var(--dark-bg)',
              border: '1px solid var(--dark-border)',
              color: 'var(--text-primary)'
            }}
          />
          <button 
            className="btn btn-primary"
            onClick={handleCreateBattle}
            disabled={loading}
          >
            Start Battle
          </button>
        </div>
      </div>

      {/* Active Battles */}
      <div className="battles-grid">
        <AnimatePresence>
          {battles.map((battle) => (
            <motion.div
              key={battle.id}
              className="battle-card card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="battle-header">
                <h4 style={{ color: 'var(--neon-purple)' }}>{battle.topic}</h4>
                <div className="battle-meta">
                  <Clock size={14} />
                  <span>{new Date(battle.createdAt).toLocaleDateString()}</span>
                  <Users size={14} />
                  <span>{battle.votes} votes</span>
                </div>
              </div>

              <div className="battle-contestants">
                {battle.contestants.map((contestant) => (
                  <div key={contestant.id} className="contestant">
                    <div className="contestant-info">
                      <img 
                        src={contestant.avatarUrl} 
                        alt={contestant.name}
                        className="contestant-avatar"
                      />
                      <div>
                        <h5 style={{ color: 'var(--neon-cyan)' }}>{contestant.name}</h5>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          {contestant.argument}
                        </p>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleVote(battle.id, contestant.id)}
                      disabled={battle.userVoted}
                    >
                      <Trophy size={16} />
                      Vote
                    </button>
                  </div>
                ))}
              </div>

              {battle.winner && (
                <div className="battle-winner" style={{ 
                  background: 'rgba(0, 255, 0, 0.1)',
                  border: '1px solid var(--neon-green)',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: 'var(--space-md)'
                }}>
                  <Trophy size={20} style={{ color: 'var(--neon-yellow)' }} />
                  <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>
                    Winner: {battle.winner.name}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {battles.length === 0 && !loading && (
        <div className="text-center" style={{ color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>
          <Sword size={64} style={{ opacity: 0.5, marginBottom: 'var(--space-md)' }} />
          <p>No active battles. Create the first one!</p>
        </div>
      )}
    </div>
  )
}

export default BattleArena
