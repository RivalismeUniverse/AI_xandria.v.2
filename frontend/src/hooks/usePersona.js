import { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { bedrockService } from '../services/aws-bedrock'

export const usePersona = () => {
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load all personas on mount
  useEffect(() => {
    loadPersonas()
  }, [])

  const loadPersonas = async () => {
    setLoading(true)
    try {
      const data = await apiService.getPersonas()
      setPersonas(data)
    } catch (err) {
      setError('Failed to load personas')
      console.error('Error loading personas:', err)
    } finally {
      setLoading(false)
    }
  }

  const generatePersona = async (personaData) => {
    setLoading(true)
    setError('')
    
    try {
      // Generate persona using Amazon Bedrock
      const generatedPersona = await bedrockService.generatePersona(personaData)
      
      // Save to backend
      const savedPersona = await apiService.createPersona(generatedPersona)
      
      // Update local state
      setPersonas(prev => [savedPersona, ...prev])
      
      return savedPersona
      
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate persona'
      setError(errorMsg)
      console.error('Error generating persona:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getPersona = async (id) => {
    try {
      return await apiService.getPersona(id)
    } catch (err) {
      setError('Failed to fetch persona details')
      console.error('Error fetching persona:', err)
      throw err
    }
  }

  const updatePersona = async (id, updates) => {
    try {
      const updatedPersona = await apiService.updatePersona(id, updates)
      setPersonas(prev => 
        prev.map(p => p.id === id ? updatedPersona : p)
      )
      return updatedPersona
    } catch (err) {
      setError('Failed to update persona')
      console.error('Error updating persona:', err)
      throw err
    }
  }

  const deletePersona = async (id) => {
    try {
      await apiService.deletePersona(id)
      setPersonas(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      setError('Failed to delete persona')
      console.error('Error deleting persona:', err)
      throw err
    }
  }

  const generatePersonaImage = async (personaId, prompt) => {
    try {
      const imageUrl = await bedrockService.generatePersonaImage(personaId, prompt)
      return imageUrl
    } catch (err) {
      setError('Failed to generate persona image')
      console.error('Error generating image:', err)
      throw err
    }
  }

  return {
    personas,
    loading,
    error,
    generatePersona,
    getPersona,
    updatePersona,
    deletePersona,
    generatePersonaImage,
    refreshPersonas: loadPersonas
  }
}
