const express = require('express');
const router = express.Router();
const { User, Persona } = require('../models');
const { Op } = require('sequelize');
const { generateToken, verifySignature } = require('../middleware/auth');
const auth = require('../middleware/auth').auth;
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errorHandler');

/**
 * POST /api/wallet/connect
 * Connect wallet and authenticate user
 */
router.post('/connect', async (req, res, next) => {
  try {
    const { wallet_address, signature, message } = req.body;

    if (!wallet_address || !signature) {
      throw new ValidationError('wallet_address and signature required');
    }

    // Verify signature
    const expectedMessage = message || `Sign this message to authenticate with AI_XANDRIA: ${Date.now()}`;
    const isValid = verifySignature(expectedMessage, signature, wallet_address);

    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid signature',
        message: 'Signature verification failed' 
      });
    }

    // Find or create user
    let user = await User.findOne({ 
      where: { wallet_address: wallet_address.toLowerCase() } 
    });

    if (!user) {
      // Create new user
      user = await User.create({
        wallet_address: wallet_address.toLowerCase(),
        last_login: new Date()
      });

      logger.info('New user created', {
        userId: user.id,
        wallet: wallet_address
      });
    } else {
      // Update last login
      await user.update({ last_login: new Date() });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    logger.info('Wallet connected', {
      userId: user.id,
      wallet: wallet_address
    });

    res.json({
      message: 'Wallet connected successfully',
      token,
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        username: user.username,
        total_revenue: user.total_revenue
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallet/profile
 * Get authenticated user profile
 */
router.get('/profile', auth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Persona,
        as: 'personas',
        attributes: ['id', 'name', 'avatar_url', 'elo_rating', 'total_battles', 'total_wins']
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate stats
    const stats = {
      total_personas: user.personas.length,
      total_battles: user.personas.reduce((sum, p) => sum + p.total_battles, 0),
      total_wins: user.personas.reduce((sum, p) => sum + p.total_wins, 0),
      total_revenue: user.total_revenue
    };

    res.json({
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        last_login: user.last_login
      },
      stats,
      personas: user.personas
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/wallet/profile
 * Update user profile
 */
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { username, email } = req.body;

    const updates = {};
    
    if (username) {
      // Check if username already taken
      const existing = await User.findOne({ 
        where: { 
          username,
          id: { [Op.ne]: req.user.id }
        } 
      });

      if (existing) {
        return res.status(400).json({ 
          error: 'Username already taken' 
        });
      }

      updates.username = username;
    }

    if (email) {
      updates.email = email;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'No fields to update' 
      });
    }

    await req.user.update(updates);

    logger.info('Profile updated', {
      userId: req.user.id,
      updates
    });

    res.json({
      message: 'Profile updated successfully',
      user: req.user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallet/stats
 * Get wallet statistics
 */
router.get('/stats', auth, async (req, res, next) => {
  try {
    const { Op } = require('sequelize');
    
    // Get personas
    const personas = await Persona.findAll({
      where: { creator_id: req.user.id },
      attributes: [
        'id',
        'name', 
        'total_battles',
        'total_wins',
        'total_chats',
        'revenue_earned',
        'elo_rating'
      ]
    });

    // Calculate totals
    const totalPersonas = personas.length;
    const totalBattles = personas.reduce((sum, p) => sum + p.total_battles, 0);
    const totalWins = personas.reduce((sum, p) => sum + p.total_wins, 0);
    const totalChats = personas.reduce((sum, p) => sum + p.total_chats, 0);
    const totalRevenue = personas.reduce((sum, p) => sum + parseFloat(p.revenue_earned), 0);
    
    const winRate = totalBattles > 0 
      ? ((totalWins / totalBattles) * 100).toFixed(1)
      : 0;

    // Get top persona
    const topPersona = personas.reduce((best, current) => {
      return (current.elo_rating > (best?.elo_rating || 0)) ? current : best;
    }, null);

    res.json({
      overview: {
        total_personas: totalPersonas,
        total_battles: totalBattles,
        total_wins: totalWins,
        win_rate: parseFloat(winRate),
        total_chats: totalChats,
        total_revenue: totalRevenue.toFixed(4)
      },
      top_persona: topPersona ? {
        id: topPersona.id,
        name: topPersona.name,
        elo_rating: topPersona.elo_rating,
        battles: topPersona.total_battles,
        wins: topPersona.total_wins
      } : null,
      personas
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallet/message
 * Get message to sign for authentication
 */
router.get('/message', (req, res) => {
  const timestamp = Date.now();
  const message = `Sign this message to authenticate with AI_XANDRIA: ${timestamp}`;
  
  res.json({
    message,
    timestamp
  });
});

module.exports = router;
