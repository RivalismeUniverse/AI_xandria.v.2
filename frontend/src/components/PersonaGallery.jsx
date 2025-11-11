import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { usePersona } from '../hooks/usePersona'
import PersonaCard from './PersonaCard'
import ChatWidget from './ChatWidget'
import { Search, Filter, Users } from 'lucide-react'

const PersonaGallery = () => {
  const { personas, loading, error } = usePersona()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPersona, setSelectedPersona] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'content-creator', label: 'Content Creators' },
    { value: 'academic', label: 'Academic' },
    { value: 'tech', label: 'Technology' },
    { value: 'mystical', label: 'Mystical' }
  ]

  const filteredPersonas = personas.filter(persona => {
    const matchesSearch = persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         persona.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || persona.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleChat = (persona) => {
    setSelectedPersona(persona)
    setIsChatOpen(true)
  }

  const handleBattle = (persona) => {
    // Navigate to battle arena with this persona pre-selected
    console.log('Battle with:', persona.name)
    // This would typically use navigation context or router
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ 
        padding: 'var(--space-xl)',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}>
        <div className="loading-spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid var(--dark-border)',
          borderTop: '4px solid var(--neon-cyan)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto var(--space-md)'
        }} />
        <p>Loading personas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container" style={{ 
        padding: 'var(--space-xl)',
        textAlign: 'center',
        color: 'var(--neon-pink)'
      }}>
        <p>Error loading personas: {error}</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="gallery-container" style={{ padding: 'var(--space-xl)' }}>
      <div className="gallery-header text-center mb-8">
        <h1 className="neon-title">🎨 PERSONA GALLERY</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          Discover and interact with AI personas created by the community
        </p>
      </div>

      {/* Filters and Search */}
      <div className="filters-section card" style={{ 
        marginBottom: 'var(--space-xl)',
        padding: 'var(--space-lg)'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: 'var(--space-md)',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search 
              size={20} 
              style={{ 
                position: 'absolute',
                left: 'var(--space-md)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} 
            />
            <input
              type="text"
              placeholder="Search personas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-sm) var(--space-md) var(--space-sm) calc(var(--space-md) * 2 + 20px)',
                background: 'var(--dark-bg)',
                border: '1px solid var(--dark-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-primary)'
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              background: 'var(--dark-bg)',
              border: '1px solid var(--dark-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-primary)',
              minWidth: '200px'
            }}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--space-xs)',
            color: 'var(--text-muted)',
            fontSize: '0.9rem'
          }}>
            <Users size={16} />
            <span>{filteredPersonas.length} personas</span>
          </div>
        </div>
      </div>

      {/* Persona Grid */}
      <div className="personas-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 'var(--space-lg)'
      }}>
        {filteredPersonas.map((persona, index) => (
          <motion.div
            key={persona.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <PersonaCard
              persona={persona}
              onChat={handleChat}
              onBattle={handleBattle}
              onViewDetails={() => console.log('View details:', persona.name)}
            />
          </motion.div>
        ))}
      </div>

      {filteredPersonas.length === 0 && (
        <div className="empty-state text-center" style={{ 
          padding: 'var(--space-xl)',
          color: 'var(--text-muted)'
        }}>
          <Users size={64} style={{ opacity: 0.5, marginBottom: 'var(--space-md)' }} />
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
            No personas found
          </h3>
          <p>Try adjusting your search criteria or create a new persona.</p>
        </div>
      )}

      {/* Chat Widget */}
      {selectedPersona && (
        <ChatWidget
          persona={selectedPersona}
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false)
            setSelectedPersona(null)
          }}
        />
      )}
    </div>
  )
}

export default PersonaGallery
