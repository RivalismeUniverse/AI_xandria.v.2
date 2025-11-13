import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { usePersona } from '../hooks/usePersona';
import toast from 'react-hot-toast';

export default function PersonaGenerator({ isOpen, onClose, onSuccess }) {
  const { createPersona, loading } = usePersona();
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    specialization: '',
    personality: '',
    visualDescription: '',
    intelligence: 50,
    creativity: 50,
    persuasiveness: 50
  });

  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePreview = () => {
    if (!formData.name || !formData.category || !formData.specialization) {
      toast.error('Please fill required fields');
      return;
    }

    const expertise = formData.specialization.split(',').map(s => s.trim());
    
    setPreview({
      name: formData.name,
      description: `${formData.category} AI specialized in ${formData.specialization}`,
      personality: formData.personality || 'Intelligent and adaptive',
      expertise,
      intelligence: formData.intelligence,
      creativity: formData.creativity,
      persuasiveness: formData.persuasiveness
    });

    toast.success('Preview generated!');
  };

  const handleCreate = async () => {
    if (!preview) {
      toast.error('Generate preview first');
      return;
    }

    try {
      const persona = await createPersona(preview);
      toast.success(`${persona.name} created successfully!`);
      onSuccess && onSuccess(persona);
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="cosmic-card w-full max-w-5xl max-h-[90vh] overflow-y-auto"
          style={{
            background: 'rgba(15, 0, 30, 0.98)',
            backdropFilter: 'blur(25px)'
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 p-6 flex justify-between items-center"
               style={{
                 background: 'rgba(15, 0, 30, 0.98)',
                 backdropFilter: 'blur(25px)',
                 borderBottom: '1px solid rgba(255, 0, 255, 0.3)'
               }}>
            <h3 className="cosmic-text text-2xl font-bold">
              🎨 Create Your AI Persona
            </h3>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-opacity-20"
              style={{
                color: '#ff00ff',
                background: 'rgba(255, 0, 255, 0.1)'
              }}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Form Grid */}
          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* LEFT: Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold" style={{ color: '#ff00ff' }}>
                  📝 Persona Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., NeonGhost, Master Seijuro"
                  className="cosmic-input"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold" style={{ color: '#ff00ff' }}>
                  🎭 Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="cosmic-input"
                >
                  <option value="">Select Category</option>
                  <option value="Content Creator">Content Creator</option>
                  <option value="Academic">Academic</option>
                  <option value="Business">Business</option>
                  <option value="Creative">Creative</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-semibold" style={{ color: '#ff00ff' }}>
                  💼 Specialization *
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Quantum Physics, Poetry"
                  className="cosmic-input"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold" style={{ color: '#ff00ff' }}>
                  🧠 Personality Traits
                </label>
                <textarea
                  name="personality"
                  value={formData.personality}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe personality, skills, expertise..."
                  className="cosmic-input resize-none"
                />
              </div>

              {/* Trait Sliders */}
              <div className="space-y-3">
                <TraitSlider
                  label="Intelligence"
                  value={formData.intelligence}
                  onChange={(val) => setFormData(prev => ({ ...prev, intelligence: val }))}
                  color="#00ffff"
                />
                <TraitSlider
                  label="Creativity"
                  value={formData.creativity}
                  onChange={(val) => setFormData(prev => ({ ...prev, creativity: val }))}
                  color="#ff00ff"
                />
                <TraitSlider
                  label="Persuasiveness"
                  value={formData.persuasiveness}
                  onChange={(val) => setFormData(prev => ({ ...prev, persuasiveness: val }))}
                  color="#00ff00"
                />
              </div>

              <button
                onClick={generatePreview}
                disabled={loading}
                className="neon-btn w-full"
                style={{
                  background: 'linear-gradient(135deg, #00ff00, #00dd00)',
                  border: 'none',
                  color: '#000'
                }}
              >
                ✨ Generate Preview
              </button>
            </div>

            {/* RIGHT: Preview */}
            <div>
              <h3 className="cosmic-text text-xl font-bold mb-4">
                👁️ Preview
              </h3>
              <div className="cosmic-card p-6 min-h-[300px]"
                   style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
                {preview ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h4 className="text-xl font-bold mb-2" style={{ color: '#00ffff' }}>
                      {preview.name}
                    </h4>
                    <p className="mb-4" style={{ color: '#cbd5e1' }}>
                      {preview.description}
                    </p>
                    
                    <div className="mb-4">
                      <span className="text-sm font-semibold" style={{ color: '#ff00ff' }}>
                        Expertise:
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {preview.expertise.map((exp, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{
                              background: 'rgba(255, 0, 255, 0.2)',
                              border: '1px solid rgba(255, 0, 255, 0.4)',
                              color: '#ff00ff'
                            }}
                          >
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <PreviewTrait label="Intelligence" value={preview.intelligence} color="#00ffff" />
                      <PreviewTrait label="Creativity" value={preview.creativity} color="#ff00ff" />
                      <PreviewTrait label="Persuasiveness" value={preview.persuasiveness} color="#00ff00" />
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p style={{ color: '#888' }}>
                      🎭 Your AI persona will appear here...
                    </p>
                    <p className="text-sm mt-2" style={{ color: '#666' }}>
                      Fill the form and click "Generate" to create your unique persona!
                    </p>
                  </div>
                )}
              </div>

              {preview && (
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="neon-btn w-full mt-4"
                  style={{
                    borderColor: '#ff00ff',
                    color: '#ff00ff'
                  }}
                >
                  {loading ? '⏳ Creating...' : '🎫 Create Persona'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TraitSlider({ label, value, onChange, color }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color }}>
          {label}
        </span>
        <span className="text-sm font-bold" style={{ color }}>
          {value}/100
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color} ${value}%, rgba(255,255,255,0.1) ${value}%, rgba(255,255,255,0.1) 100%)`
        }}
      />
    </div>
  );
}

function PreviewTrait({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: '#cbd5e1' }}>
        <span>{label}</span>
        <span className="font-semibold">{value}/100</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden"
           style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6 }}
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
