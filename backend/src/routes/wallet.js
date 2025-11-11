// backend/src/routes/wallet.js
import express from 'express';
import { rateLimit } from '../middleware/rateLimit.js';
import User from '../models/User.js';
import BlockchainService from '../services/blockchainService.js';

const router = express.Router();

// Connect wallet
router.post('/connect', rateLimit, async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required'
      });
    }

    // In production, verify signature
    // For demo, we'll trust the wallet address

    // Create or update user
    const user = await User.connectWallet(walletAddress);

    // Get user's NFTs
    const nfts = await BlockchainService.getPersonaNFTsByOwner(walletAddress);

    res.json({
      success: true,
      data: {
        user,
        nfts: nfts.nfts,
        isNewUser: user.isNew
      },
      message: user.isNew ? 'Welcome to AI_XANDRIA!' : 'Welcome back!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to connect wallet'
    });
  }
});

// Get user profile
router.get('/:address', rateLimit, async (req, res) => {
  try {
    const { address } = req.params;

    const user = await User.findByWallet(address);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's created personas
    const personas = await User.getCreatedPersonas(address);

    // Get user's NFT collection
    const nfts = await BlockchainService.getPersonaNFTsByOwner(address);

    res.json({
      success: true,
      data: {
        user,
        personas,
        nfts: nfts.nfts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// Update user profile
router.put('/:address/profile', rateLimit, async (req, res) => {
  try {
    const { address } = req.params;
    const { username, bio, avatarUrl } = req.body;

    // Verify ownership
    if (address !== req.body.walletAddress) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this profile'
      });
    }

    const updatedUser = await User.updateProfile(address, {
      username,
      bio,
      avatarUrl
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Get user stats
router.get('/:address/stats', rateLimit, async (req, res) => {
  try {
    const { address } = req.params;

    const stats = await User.getStats(address);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats'
    });
  }
});

export default router;
