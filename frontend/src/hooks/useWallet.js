import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const useWallet = () => {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    const token = localStorage.getItem('auth_token');
    const savedAddress = localStorage.getItem('wallet_address');
    
    if (token && savedAddress) {
      setAddress(savedAddress);
      setIsConnected(true);
      await initProvider(savedAddress);
    }
  };

  const initProvider = async (walletAddress) => {
    if (window.ethereum) {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const ethersSigner = await ethersProvider.getSigner();
      
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      
      // Get balance
      const bal = await ethersProvider.getBalance(walletAddress);
      setBalance(ethers.formatEther(bal));
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask!');
      return;
    }

    setIsConnecting(true);
    
    try {
      // Request accounts
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const walletAddress = accounts[0];
      
      // Sign message for authentication
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const ethersSigner = await ethersProvider.getSigner();
      
      const message = `Sign this message to authenticate with AI_XANDRIA: ${Date.now()}`;
      const signature = await ethersSigner.signMessage(message);

      // Authenticate with backend
      const response = await api.connectWallet(walletAddress, signature, message);
      
      // Save auth
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('wallet_address', walletAddress);
      
      // Update state
      setAddress(walletAddress);
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setIsConnected(true);
      
      // Get balance
      const bal = await ethersProvider.getBalance(walletAddress);
      setBalance(ethers.formatEther(bal));
      
      toast.success('Wallet connected!');
      
      return response.user;
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('wallet_address');
    
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setBalance('0');
    
    toast.success('Wallet disconnected');
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== address) {
      disconnectWallet();
      toast.info('Account changed. Please reconnect.');
    }
  };

  const signMessage = async (message) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    return await signer.signMessage(message);
  };

  return {
    address,
    provider,
    signer,
    isConnected,
    isConnecting,
    balance,
    connectWallet,
    disconnectWallet,
    signMessage
  };
};
