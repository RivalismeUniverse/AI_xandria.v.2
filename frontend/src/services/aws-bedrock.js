import { apiService } from './api'

class AWSBedrockService {
  constructor() {
    this.initialized = false
  }

  // Generate persona using Amazon Bedrock via backend
  async generatePersona(personaData) {
    try {
      const response = await apiService.generatePersona(personaData)
      return response
    } catch (error) {
      console.error('Error generating persona with Bedrock:', error)
      throw new Error('Failed to generate persona: ' + (error.message || 'Unknown error'))
    }
  }

  // Generate persona image using Amazon Titan Image Generator via backend
  async generatePersonaImage(personaId, prompt) {
    try {
      const response = await apiService.generateImage(prompt)
      return response.imageUrl
    } catch (error) {
      console.error('Error generating persona image:', error)
      throw new Error('Failed to generate persona image: ' + (error.message || 'Unknown error'))
    }
  }

  // Generate battle arguments for personas
  async generateBattleArguments(persona, topic, opponentArgument = '') {
    try {
      const response = await apiService.generateBattleArgument({
        personaId: persona.id,
        topic,
        opponentArgument
      })
      return response.argument
    } catch (error) {
      console.error('Error generating battle argument:', error)
      throw new Error('Failed to generate battle argument: ' + (error.message || 'Unknown error'))
    }
  }

  // Chat with persona using Bedrock
  async chatWithPersona(personaId, message, conversationHistory = []) {
    try {
      const response = await apiService.sendMessage(personaId, {
        message,
        history: conversationHistory
      })
      return response
    } catch (error) {
      console.error('Error chatting with persona:', error)
      throw new Error('Failed to get response from persona: ' + (error.message || 'Unknown error'))
    }
  }

  // Analyze persona traits and suggest improvements
  async analyzePersonaTraits(personaData) {
    try {
      const response = await apiService.analyzePersona(personaData)
      return response.analysis
    } catch (error) {
      console.error('Error analyzing persona traits:', error)
      throw new Error('Failed to analyze persona: ' + (error.message || 'Unknown error'))
    }
  }

  // Generate multiple persona variations
  async generatePersonaVariations(basePersona, count = 3) {
    try {
      const response = await apiService.generateVariations({
        basePersona,
        count
      })
      return response.variations
    } catch (error) {
      console.error('Error generating persona variations:', error)
      throw new Error('Failed to generate variations: ' + (error.message || 'Unknown error'))
    }
  }

  // Health check for Bedrock service
  async healthCheck() {
    try {
      await apiService.healthCheck()
      return { status: 'healthy', service: 'aws-bedrock' }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        service: 'aws-bedrock',
        error: error.message 
      }
    }
  }
}

export const bedrockService = new AWSBedrockService()
