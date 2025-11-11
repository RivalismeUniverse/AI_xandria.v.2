import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    })

    // Add request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error.response?.data || error)
      }
    )
  }

  // Persona endpoints
  async getPersonas(params = {}) {
    return this.client.get('/personas', { params })
  }

  async getPersona(id) {
    return this.client.get(`/personas/${id}`)
  }

  async createPersona(personaData) {
    return this.client.post('/personas', personaData)
  }

  async updatePersona(id, updates) {
    return this.client.put(`/personas/${id}`, updates)
  }

  async deletePersona(id) {
    return this.client.delete(`/personas/${id}`)
  }

  // Battle endpoints
  async getBattles(params = {}) {
    return this.client.get('/battles', { params })
  }

  async getBattle(id) {
    return this.client.get(`/battles/${id}`)
  }

  async createBattle(battleData) {
    return this.client.post('/battles', battleData)
  }

  async voteOnBattle(battleId, personaId) {
    return this.client.post(`/battles/${battleId}/vote`, { personaId })
  }

  async getBattleResults(battleId) {
    return this.client.get(`/battles/${battleId}/results`)
  }

  // Chat endpoints
  async sendMessage(personaId, message) {
    return this.client.post(`/chat/${personaId}/send`, { message })
  }

  async getChatHistory(personaId) {
    return this.client.get(`/chat/${personaId}/history`)
  }

  async unlockChat(personaId, paymentData) {
    return this.client.post(`/chat/${personaId}/unlock`, paymentData)
  }

  // NFT endpoints
  async mintPersonaNFT(personaId, metadata) {
    return this.client.post(`/nft/mint`, { personaId, metadata })
  }

  async getNFTs(ownerAddress) {
    return this.client.get('/nft', { params: { owner: ownerAddress } })
  }

  async listNFT(nftId, price) {
    return this.client.post(`/nft/${nftId}/list`, { price })
  }

  async purchaseNFT(nftId, paymentData) {
    return this.client.post(`/nft/${nftId}/purchase`, paymentData)
  }

  // Image generation
  async generateImage(prompt, style = 'digital art') {
    return this.client.post('/images/generate', { prompt, style })
  }

  // Wallet/auth endpoints
  async connectWallet(walletData) {
    return this.client.post('/wallet/connect', walletData)
  }

  async getUserProfile(walletAddress) {
    return this.client.get(`/wallet/${walletAddress}`)
  }

  // Health check
  async healthCheck() {
    return this.client.get('/health')
  }
}

export const apiService = new ApiService()
