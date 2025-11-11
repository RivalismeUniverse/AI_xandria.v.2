import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { blockchainService } from '../services/blockchain'

const WalletContext = createContext()

export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [balance, setBalance] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if wallet was previously connected
  useEffect(() => {
    checkPreviousConnection()
  }, [])

  const checkPreviousConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          await handleConnection(accounts[0])
        }
      } catch (error) {
        console.error('Error checking previous connection:', error)
      }
    }
  }

  const connectWallet = async () => {
    setLoading(true)
    setError('')
    
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask!')
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      await handleConnection(accounts[0])
      
    } catch (error) {
      console.error('Wallet connection failed:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConnection = async (address) => {
    setWalletAddress(address)
    setIsConnected(true)
    
    // Get balance
    const provider = new ethers.BrowserProvider(window.ethereum)
    const balance = await provider.getBalance(address)
    setBalance(ethers.formatEther(balance))

    // Initialize blockchain service
    await blockchainService.initialize()

    // Setup event listeners
    setupEventListeners()
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setWalletAddress('')
    setBalance('0')
    setError('')
    
    // Clear any stored session data
    localStorage.removeItem('walletConnected')
    localStorage.removeItem('walletAddress')
  }

  const setupEventListeners = () => {
    if (window.ethereum) {
      // Account changed
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          handleConnection(accounts[0])
        }
      })

      // Chain changed
      window.ethereum.on('chainChanged', () => {
        window.location.reload()
      })
    }
  }

  const switchToSomniaNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xC488' }], // 50312 in hex
      })
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xC488',
                chainName: 'Somnia Testnet',
                rpcUrls: ['https://rpc.somnia.network'],
                blockExplorerUrls: ['https://shannon-explorer.somnia.network/'],
                nativeCurrency: {
                  name: 'STT',
                  symbol: 'STT',
                  decimals: 18
                },
              },
            ],
          })
        } catch (addError) {
          throw new Error('Failed to add Somnia network to MetaMask')
        }
      } else {
        throw new Error('Failed to switch to Somnia network')
      }
    }
  }

  const value = {
    isConnected,
    walletAddress,
    balance,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    switchToSomniaNetwork
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
