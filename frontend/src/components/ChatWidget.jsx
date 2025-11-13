import { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  MinusIcon, 
  PaperAirplaneIcon,
  SparklesIcon 
} from '@heroicons/react/24/solid';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export default function ChatWidget({ persona, onClose }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (persona) {
      initChat();
    }
  }, [persona]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initChat = async () => {
    // For demo: assume chat is unlocked
    // In production: check payment first
    try {
      const mockSession = {
        id: 'demo-session',
        persona_id: persona.id,
        is_paid: true
      };
      setSession(mockSession);
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm ${persona.name}. How can I help you today?`,
        created_at: new Date()
      }]);
    } catch (error) {
      toast.error('Failed to initialize chat');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage = {
      role: 'user',
      content: input,
      created_at: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await api.sendChatMessage(session.id, input);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.assistant_message.content,
        created_at: new Date(response.assistant_message.created_at)
      }]);
    } catch (error) {
      toast.error('Failed to send message');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date()
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!persona) return null;

  return (
    <Draggable handle=".drag-handle" bounds="parent">
      <div
        className="fixed z-50"
        style={{
          width: isMinimized ? '300px' : '400px',
          bottom: '20px',
          right: '20px'
        }}
      >
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="cosmic-card overflow-hidden"
            style={{
              background: 'rgba(15, 0, 30, 0.98)',
              backdropFilter: 'blur(25px)',
              maxHeight: isMinimized ? 'auto' : '600px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header - Draggable */}
            <div
              className="drag-handle flex items-center justify-between p-4 cursor-move"
              style={{
                background: 'linear-gradient(135deg, #ff00ff, #a020f0)',
                borderBottom: isMinimized ? 'none' : '2px solid rgba(255, 0, 255, 0.3)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                     style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{persona.name}</h4>
                  <p className="text-xs text-white opacity-75">
                    {sending ? 'Typing...' : 'Online'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
                >
                  <MinusIcon className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
                >
                  <XMarkIcon className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            {!isMinimized && (
              <>
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                  style={{
                    minHeight: '300px',
                    maxHeight: '400px'
                  }}
                >
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[80%] p-3 rounded-lg"
                        style={{
                          background: msg.role === 'user'
                            ? 'linear-gradient(135deg, #ff00ff, #a020f0)'
                            : 'rgba(255, 255, 255, 0.1)',
                          color: '#fff'
                        }}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4" style={{ borderTop: '1px solid rgba(255, 0, 255, 0.3)' }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={sending}
                      className="cosmic-input flex-1"
                      style={{ marginBottom: 0 }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !input.trim()}
                      className="neon-btn px-4"
                      style={{
                        background: 'linear-gradient(135deg, #ff00ff, #a020f0)',
                        border: 'none',
                        minWidth: 'auto'
                      }}
                    >
                      <PaperAirplaneIcon className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Draggable>
  );
}
