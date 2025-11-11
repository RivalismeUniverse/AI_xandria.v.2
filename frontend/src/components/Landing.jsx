import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Sword, MessageCircle, ShoppingCart, Users, Rocket } from 'lucide-react'

const Landing = ({ onNavigate }) => {
  const features = [
    {
      icon: Sparkles,
      title: 'Create AI Personas',
      description: 'Generate unique AI personas with Amazon Bedrock - no coding required',
      color: 'var(--neon-pink)',
      action: () => onNavigate('generate')
    },
    {
      icon: Sword,
      title: 'Battle Arena',
      description: 'Watch AI personas debate and vote for the most compelling arguments',
      color: 'var(--neon-cyan)',
      action: () => onNavigate('battle')
    },
    {
      icon: MessageCircle,
      title: 'Pay-to-Chat',
      description: 'Chat with any AI persona and earn revenue as a creator',
      color: 'var(--neon-green)',
      action: () => onNavigate('gallery')
    },
    {
      icon: ShoppingCart,
      title: 'NFT Marketplace',
      description: 'Buy, sell, and trade AI personas as NFTs on Somnia blockchain',
      color: 'var(--neon-yellow)',
      action: () => onNavigate('marketplace')
    }
  ]

  const stats = [
    { value: '1,240+', label: 'AI Personas Created' },
    { value: '8,567+', label: 'Battles Fought' },
    { value: '23.4K+', label: 'Chat Sessions' },
    { value: '892+', label: 'Active Creators' }
  ]

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section" style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gradient-dark)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="hero-content text-center" style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '800px',
          padding: 'var(--space-xl)'
        }}>
          <motion.h1 
            className="neon-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            AI_XANDRIA v2.0
          </motion.h1>
          
          <motion.p 
            style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '1.5rem',
              marginBottom: 'var(--space-xl)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            The Infrastructure Layer for Ownable AI Personas
          </motion.p>

          <motion.p 
            style={{ 
              color: 'var(--text-muted)', 
              fontSize: '1.1rem',
              marginBottom: 'var(--space-xl)',
              lineHeight: '1.6'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Create, own, evaluate, and monetize AI agents without code. 
            Powered by Amazon Bedrock and built with Amazon Q Developer.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => onNavigate('generate')}
              style={{ 
                fontSize: '1.2rem',
                padding: 'var(--space-md) var(--space-xl)'
              }}
            >
              <Rocket style={{ marginRight: 'var(--space-sm)' }} />
              Start Creating
            </button>
          </motion.div>
        </div>

        {/* Animated background elements */}
        <div className="hero-background">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="floating-particle"
              style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                background: i % 3 === 0 ? 'var(--neon-cyan)' : 
                           i % 3 === 1 ? 'var(--neon-pink)' : 'var(--neon-yellow)',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: 'var(--space-xl)', background: 'var(--dark-bg)' }}>
        <div className="features-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-lg)',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                className="feature-card card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={feature.action}
                style={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: 'var(--space-xl)',
                  background: 'var(--dark-surface)',
                  border: `2px solid ${feature.color}20`,
                  transition: 'all var(--transition-normal)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = feature.color
                  e.currentTarget.style.boxShadow = `0 0 30px ${feature.color}40`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${feature.color}20`
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)'
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}40)`,
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-lg)',
                  border: `2px solid ${feature.color}`
                }}>
                  <Icon size={32} style={{ color: feature.color }} />
                </div>
                <h3 style={{ color: feature.color, marginBottom: 'var(--space-md)' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ 
        padding: 'var(--space-xl)', 
        background: 'var(--dark-surface)',
        borderTop: '1px solid var(--dark-border)',
        borderBottom: '1px solid var(--dark-border)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-lg)',
          maxWidth: '1000px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div style={{ 
                color: 'var(--neon-cyan)', 
                fontSize: '2.5rem',
                fontWeight: 'bold',
                marginBottom: 'var(--space-xs)'
              }}>
                {stat.value}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: 'var(--space-xl)',
        textAlign: 'center'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 style={{ color: 'var(--neon-purple)', marginBottom: 'var(--space-md)' }}>
            Ready to Create Your AI Persona?
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1.2rem',
            marginBottom: 'var(--space-xl)',
            maxWidth: '600px',
            margin: '0 auto var(--space-xl)'
          }}>
            Join thousands of creators building the future of AI interaction
          </p>
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => onNavigate('generate')}
          >
            <Sparkles style={{ marginRight: 'var(--space-sm)' }} />
            Start Creating for Free
          </button>
        </motion.div>
      </section>
    </div>
  )
}

export default Landing
