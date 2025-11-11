import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle, Wallet } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'

const ChatWidget = ({ persona, isOpen, onClose }) => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [needsPayment, setNeedsPayment] = useState(true)
  const messagesEndRef = useRef(null)
  const { isConnected, connectWallet, balance } = useWallet()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    if (!isConnected) {
      await connectWallet()
      return
    }

    if (needsPayment) {
      setNeedsPayment(false)
      return
    }

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        text: `This is ${persona.name}'s response to: "${inputMessage}". In a real implementation, this would come from Amazon Bedrock.`,
        sender: 'persona',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 2000)
  }

  const handlePayment = async () => {
    // In real implementation, process payment via blockchain
    setNeedsPayment(false)
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="chat-widget"
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.9 }}
      style={{
        position: 'fixed',
        bottom: 'var(--space-lg)',
        right: 'var(--space-lg)',
        width: '400px',
        height: '600px',
        background: 'var(--dark-card)',
        border: '2px solid var(--neon-cyan)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-glow-cyan), var(--shadow-card)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div className="chat-header" style={{
        background: 'rgba(0, 255, 255, 0.1)',
        padding: 'var(--space-md)',
        borderBottom: '1px solid var(--neon-cyan)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="chat-persona-info" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <img 
            src={persona.avatarUrl} 
            alt={persona.name}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--neon-pink)'
            }}
          />
          <div>
            <h4 style={{ color: 'var(--neon-cyan)', margin: 0 }}>{persona.name}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
              {persona.tagline}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--neon-pink)',
            cursor: 'pointer',
            padding: 'var(--space-xs)'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{
        flex: 1,
        padding: 'var(--space-md)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)'
      }}>
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`message ${message.sender}-message`}
              style={{
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-lg)',
                background: message.sender === 'user' 
                  ? 'rgba(0, 255, 255, 0.2)' 
                  : 'rgba(255, 20, 147, 0.2)',
                border: `1px solid ${message.sender === 'user' ? 'var(--neon-cyan)' : 'var(--neon-pink)'}`,
                borderBottomRightRadius: message.sender === 'user' ? 'var(--radius-xs)' : 'var(--radius-lg)',
                borderBottomLeftRadius: message.sender === 'user' ? 'var(--radius-lg)' : 'var(--radius-xs)'
              }}
            >
              <div style={{ color: 'var(--text-primary)' }}>{message.text}</div>
              <div style={{ 
                fontSize: '0.7rem', 
                color: 'var(--text-muted)', 
                marginTop: 'var(--space-xs)',
                textAlign: message.sender === 'user' ? 'right' : 'left'
              }}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="message persona-message"
            style={{
              alignSelf: 'flex-start',
              maxWidth: '80%',
              padding: 'var(--space-md)',
              background: 'rgba(255, 20, 147, 0.2)',
              border: '1px solid var(--neon-pink)',
              borderRadius: 'var(--radius-lg)',
              borderBottomLeftRadius: 'var(--radius-xs)'
            }}
          >
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Payment Gate */}
      {needsPayment && (
        <div className="payment-gate" style={{
          padding: 'var(--space-md)',
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid var(--neon-yellow)',
          borderRadius: 'var(--radius-md)',
          margin: 'var(--space-md)',
          textAlign: 'center'
        }}>
          <Wallet size={24} style={{ color: 'var(--neon-yellow)', marginBottom: 'var(--space-sm)' }} />
          <h4 style={{ color: 'var(--neon-yellow)', marginBottom: 'var(--space-xs)' }}>
            Unlock Chat Access
          </h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
            Pay {persona.price || '5 STT'} to start chatting with {persona.name}
          </p>
          <button 
            className="btn btn-primary"
            onClick={handlePayment}
            disabled={!isConnected}
          >
            {isConnected ? `Pay ${persona.price || '5 STT'}` : 'Connect Wallet First'}
          </button>
        </div>
      )}

      {/* Input */}
      {!needsPayment && (
        <div className="chat-input" style={{
          padding: 'var(--space-md)',
          borderTop: '1px solid var(--dark-border)',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
          display: 'flex',
          gap: 'var(--space-sm)'
        }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: 'var(--space-sm) var(--space-md)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--dark-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-primary)'
            }}
          />
          <button 
            className="btn btn-primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{ padding: 'var(--space-sm) var(--space-md)' }}
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default ChatWidget
