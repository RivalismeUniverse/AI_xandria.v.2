const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Connect wallet and authenticate
router.post('/connect', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    // In a real implementation, verify the signature
    // For hackathon, we'll trust the wallet address
    const signatureValid = true; // await verifySignature(walletAddress, signature, message);

    if (!signatureValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Find or create user
    let user = await User.findOne({ where: { wallet_address: walletAddress } });
    
    if (!user) {
      user = await User.create({
        wallet_address: walletAddress,
        username: `user_${walletAddress.slice(2, 8)}`,
        created_date: new Date(),
        last_active: new Date()
      });
    } else {
      await user.update({ last_active: new Date() });
    }

    // Generate JWT token
    const token = jwt.sign(
      { walletAddress, userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('Wallet Connected', { walletAddress, userId: user.id });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        personaCount: user.persona_count,
        totalEarnings: user.total_earnings,
        reputationScore: user.reputation_score
      }
    });

  } catch (error) {
    logger.error('Wallet Connect Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const walletAddress = req.walletAddress;

    const user = await User.findOne({ 
      where: { wallet_address: walletAddress }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      profile: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        email: user.email,
        personaCount: user.persona_count,
        totalEarnings: user.total_earnings,
        totalSpent: user.total_spent,
        battleParticipations: user.battle_participations,
        reputationScore: user.reputation_score,
        lastActive: user.last_active,
        createdDate: user.created_date
      }
    });

  } catch (error) {
    logger.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const walletAddress = req.walletAddress;
    const { username, email } = req.body;

    const user = await User.findOne({ where: { wallet_address: walletAddress } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    await user.update(updateData);

    res.json({
      success: true,
      profile: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    logger.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const walletAddress = req.walletAddress;

    const user = await User.findOne({ where: { wallet_address: walletAddress } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get additional stats from related tables
    const stats = {
      basic: {
        personasCreated: user.persona_count,
        totalEarnings: user.total_earnings,
        totalSpent: user.total_spent,
        battleParticipations: user.battle_participations,
        reputationScore: user.reputation_score
      },
      marketplace: {
        nftsOwned: 0, // Would count from Persona table
        nftsListed: 0, // Would count from Persona table
        totalRevenue: user.total_earnings
      },
      activity: {
        lastActive: user.last_active,
        memberSince: user.created_date
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Get Stats Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to verify signature (placeholder)
async function verifySignature(walletAddress, signature, message) {
  // In a real implementation, use ethers.js or web3.js to verify
  // For hackathon demo, return true
  return true;
}

module.exports = router;
