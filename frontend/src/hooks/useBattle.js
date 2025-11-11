import { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { useWallet } from './useWallet'

export const useBattle = () => {
  const [battles, setBattles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { isConnected } = useWallet()

  // Load battles on mount
  useEffect(() => {
    loadBattles()
  }, [])

  const loadBattles = async () => {
    setLoading(true)
    try {
      const data = await apiService.getBattles()
      setBattles(data)
    } catch (err) {
      setError('Failed to load battles')
      console.error('Error loading battles:', err)
    } finally {
      setLoading(false)
    }
  }

  const createBattle = async (topic, personaIds = []) => {
    if (!isConnected) {
      throw new Error('Please connect your wallet first')
    }

    setLoading(true)
    setError('')
    
    try {
      const battle = await apiService.createBattle({
        topic,
        personaIds,
        createdAt: new Date().toISOString()
      })
      
      setBattles(prev => [battle, ...prev])
      return battle
      
    } catch (err) {
      const errorMsg = err.message || 'Failed to create battle'
      setError(errorMsg)
      console.error('Error creating battle:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const voteOnBattle = async (battleId, personaId) => {
    if (!isConnected) {
      throw new Error('Please connect your wallet first')
    }

    setLoading(true)
    try {
      const updatedBattle = await apiService.voteOnBattle(battleId, personaId)
      
      // Update the battle in local state
      setBattles(prev => 
        prev.map(battle => 
          battle.id === battleId ? updatedBattle : battle
        )
      )
      
      return updatedBattle
      
    } catch (err) {
      const errorMsg = err.message || 'Failed to vote on battle'
      setError(errorMsg)
      console.error('Error voting on battle:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getBattle = async (id) => {
    try {
      return await apiService.getBattle(id)
    } catch (err) {
      setError('Failed to fetch battle details')
      console.error('Error fetching battle:', err)
      throw err
    }
  }

  const getBattleResults = async (battleId) => {
    try {
      return await apiService.getBattleResults(battleId)
    } catch (err) {
      setError('Failed to fetch battle results')
      console.error('Error fetching battle results:', err)
      throw err
    }
  }

  return {
    battles,
    loading,
    error,
    createBattle,
    voteOnBattle,
    getBattle,
    getBattleResults,
    refreshBattles: loadBattles
  }
}
