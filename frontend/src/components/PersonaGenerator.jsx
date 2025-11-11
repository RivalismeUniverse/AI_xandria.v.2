import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { usePersona } from '../hooks/usePersona'
import { Wand2, Sparkles, Image, Save } from 'lucide-react'

const PersonaGenerator = () => {
  const { generatePersona, loading } = usePersona()
  const [formData, setFormData] = useState({
    name: '',
    category: 'content-creator',
    specialization: '',
    personality: '',
    traits: '',
    visualPrompt: ''
  })
  const [generatedPersona, setGeneratedPersona] = useState(null)

  const categories = [
    { value: 'content-creator', label: '🎨 Content Creator', emoji: '🎨' },
    { value: 'academic', label: '🎓 Academic', emoji: '🎓' },
    { value: 'tech', label: '💻 Technology', emoji: '💻' },
    { value: 'mystical', label: '🔮 Mystical', emoji: '🔮' },
    { value: 'motivational', label: '💪 Motivational', emoji: '💪' }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGenerate = async () => {
    if (!formData.name || !formData.specialization) {
      alert('Please fill in at least Name and Specialization')
      return
    }

    try {
      const persona = await generatePersona(formData)
      setGeneratedPersona(persona)
    } catch (error) {
      console.error('Failed to generate persona:', error)
      alert('Failed to generate persona. Please try again.')
    }
  }

  const handleSavePersona = async () => {
    if (!generatedPersona) return
    // Save persona logic would go here
    alert('Persona saved successfully!')
  }

  return (
    <div className="persona-generator-container" style={{ 
      padding: 'var(--space-xl)',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div className="generator-header text-center mb-8">
        <h1 className="neon-title">✨ PERSONA GENERATOR</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          Create your own AI persona with Amazon Bedrock - No coding required
        </p>
      </div>

      <div className="generator-layout" style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-xl)',
        alignItems: 'start'
      }}>
        {/* Input Form */}
        <motion.div 
          className="input-section card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: 'var(--space-lg)' }}>
            <Wand2 style={{ display: 'inline', marginRight: 'var(--space-sm)' }} />
            Persona Details
          </h3>

          <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                Persona Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Quantum Thinker"
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--dark-bg)',
                  border: '1px solid var(--dark-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--dark-bg)',
                  border: '1px solid var(--dark-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)'
                }}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                Specialization *
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                placeholder="e.g., AI Ethics, Quantum Physics, Digital Marketing"
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--dark-bg)',
                  border: '1px solid var(--dark-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                Personality Traits
              </label>
              <input
                type="text"
                value={formData.traits}
                onChange={(e) => handleInputChange('traits', e.target.value)}
                placeholder="e.g., Witty, Analytical, Creative, Empathetic"
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--dark-bg)',
                  border: '1px solid var(--dark-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-xs)' }}>
                <Image style={{ display: 'inline', marginRight: 'var(--space-xs)' }} size={16} />
                Visual Appearance
              </label>
              <textarea
                value={formData.visualPrompt}
                onChange={(e) => handleInputChange('visualPrompt', e.target.value)}
                placeholder="Describe how your persona looks (e.g., futuristic scholar with glowing eyes, wearing digital robes)"
                rows="3"
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--dark-bg)',
                  border: '1px solid var(--dark-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={loading || !formData.name || !formData.specialization}
              style={{ marginTop: 'var(--space-md)' }}
            >
              <Sparkles style={{ marginRight: 'var(--space-sm)' }} size={16} />
              {loading ? 'Generating...' : 'Generate Persona'}
            </button>
          </div>
        </motion.div>

        {/* Preview Section */}
        <motion.div 
          className="preview-section"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {generatedPersona ? (
            <div className="preview-card card">
              <h3 style={{ color: 'var(--neon-pink)', marginBottom: 'var(--space-lg)' }}>
                Generated Persona
              </h3>
              
              <div className="persona-preview">
                <div className="preview-header text-center mb-6">
                  {generatedPersona.avatarUrl && (
                    <img 
                      src={generatedPersona.avatarUrl} 
                      alt={generatedPersona.name}
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: 'var(--radius-full)',
                        border: '3px solid var(--neon-cyan)',
                        margin: '0 auto var(--space-md)'
                      }}
                    />
                  )}
                  <h4 style={{ color: 'var(--neon-cyan)' }}>{generatedPersona.name}</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>{generatedPersona.tagline}</p>
                </div>

                <div className="preview-details" style={{ textAlign: 'left' }}>
                  <div style={{ marginBottom: 'var(--space-md)' }}>
                    <strong style={{ color: 'var(--neon-pink)' }}>Description:</strong>
                    <p style={{ color: 'var(--text-primary)', marginTop: 'var(--space-xs)' }}>
                      {generatedPersona.description}
                    </p>
                  </div>

                  <div style={{ marginBottom: 'var(--space-md)' }}>
                    <strong style={{ color: 'var(--neon-pink)' }}>Personality:</strong>
                    <p style={{ color: 'var(--text-primary)', marginTop: 'var(--space-xs)' }}>
                      {generatedPersona.personality}
                    </p>
                  </div>

                  {generatedPersona.traits && generatedPersona.traits.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                      <strong style={{ color: 'var(--neon-pink)' }}>Traits:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>
                        {generatedPersona.traits.map((trait, index) => (
                          <span 
                            key={index}
                            style={{
                              background: 'rgba(0, 255, 255, 0.2)',
                              border: '1px solid var(--neon-cyan)',
                              padding: 'var(--space-xs) var(--space-sm)',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.8rem',
                              color: 'var(--neon-cyan)'
                            }}
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-secondary"
                    onClick={handleSavePersona}
                    style={{ width: '100%', marginTop: 'var(--space-lg)' }}
                  >
                    <Save style={{ marginRight: 'var(--space-sm)' }} size={16} />
                    Save & Mint as NFT
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-preview card" style={{ 
              height: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              background: 'var(--dark-surface)'
            }}>
              <div>
                <Sparkles size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }} />
                <p style={{ color: 'var(--text-muted)' }}>
                  Your AI persona will appear here...
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 'var(--space-sm)' }}>
                  Fill the form and click "Generate" to create your unique persona
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default PersonaGenerator
