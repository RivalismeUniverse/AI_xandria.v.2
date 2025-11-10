// backend/src/routes/wallet.js
// Wallet authentication routes for AI_XANDRIA v2.0
// Handles wallet connection and JWT token generation

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const logger = require('../utils/logger');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * POST /api/wallet/connect
 * Connect wallet and get authentication token
 */
router.post(
  '/connect',
  [
    body('wallet_address').isString().matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid wallet address'),
    body('signature').isString().withMessage('Signature required'),
    body('message').isString().withMessage('Message required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { wallet_address, signature, message } = req.body;

      // Verify signature
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== wallet_address.toLowerCase()) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Check if user exists, create if not
      let userResult = await db.query(
        'SELECT * FROM users WHERE wallet_address = $1',
        [wallet_address.toLowerCase()]
      );

      let user;
      if (userResult.rows.length === 0) {
        // Create new user
        const newUserResult = await db.query(
          `INSERT INTO users (wallet_address, created_at) 
           VALUES ($1, NOW()) 
           RETURNING *`,
          [wallet_address.toLowerCase()]
        );
        user = newUserResult.rows[0];
        logger.info(`New user created: ${wallet_address}`);
      } else {
        user = userResult.rows[0];
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          user_id: user.id, 
          wallet_address: user.wallet_address 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      logger.info(`User authenticated: ${wallet_address}`);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          wallet_address: user.wallet_address,
          username: user.username,
          avatar_url: user.avatar_url,
          created_at: user.created_at
        }
      });
    } catch (error) {
      logger.error('Error connecting wallet:', error);
      res.status(500).json({ error: 'Failed to connect wallet' });
    }
  }
);

/**
 * POST /api/wallet/nonce
 * Get a nonce for wallet signature
 */
router.post(
  '/nonce',
  [
    body('wallet_address').isString().matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid wallet address')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { wallet_address } = req.body;
      const nonce = Math.floor(Math.random() * 1000000);
      const timestamp = Date.now();

      const message = `AI_XANDRIA Authentication\n\nSign this message to connect your wallet.\n\nWallet: ${wallet_address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

      res.json({
        success: true,
        message,
        nonce,
        timestamp
      });
    } catch (error) {
      logger.error('Error generating nonce:', error);
      res.status(500).json({ error: 'Failed to generate nonce' });
    }
  }
);

/**
 * GET /api/wallet/profile
 * Get user profile
 * @authenticated
 */
router.get('/profile', async (req, res) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user
    const userResult = await db.query(
      'SELECT id, wallet_address, username, avatar_url, created_at FROM users WHERE id = $1',
      [decoded.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user stats
    const statsResult = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM personas WHERE owner_address = $1) as personas_count,
        (SELECT COUNT(*) FROM battles b 
         JOIN personas p ON (b.persona1_id = p.id OR b.persona2_id = p.id) 
         WHERE p.owner_address = $1) as battles_count,
        (SELECT COUNT(*) FROM nft_sales WHERE buyer_address = $1) as nfts_purchased,
        (SELECT COUNT(*) FROM nft_sales WHERE seller_address = $1) as nfts_sold`,
      [user.wallet_address]
    );

    res.json({
      success: true,
      user: {
        ...user,
        stats: statsResult.rows[0]
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    logger.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/wallet/profile
 * Update user profile
 * @authenticated
 */
router.put(
  '/profile',
  [
    body('username').optional().isString().trim().isLength({ min: 3, max: 50 }),
    body('avatar_url').optional().isURL()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);

      const { username, avatar_url } = req.body;
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (username !== undefined) {
        // Check if username is taken
        const usernameCheck = await db.query(
          'SELECT id FROM users WHERE username = $1 AND id != $2',
          [username, decoded.user_id]
        );

        if (usernameCheck.rows.length > 0) {
          return res.status(400).json({ error: 'Username already taken' });
        }

        updates.push(`username = $${paramCount}`);
        values.push(username);
        paramCount++;
      }

      if (avatar_url !== undefined) {
        updates.push(`avatar_url = $${paramCount}`);
        values.push(avatar_url);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      values.push(decoded.user_id);

      const result = await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      logger.info(`Profile updated for user ${decoded.user_id}`);

      res.json({
        success: true,
        user: result.rows[0]
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      logger.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

/**
 * POST /api/wallet/verify
 * Verify JWT token validity
 */
router.post('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      valid: true,
      user_id: decoded.user_id,
      wallet_address: decoded.wallet_address
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.json({ valid: false, error: 'Token expired' });
    }
    return res.json({ valid: false, error: 'Invalid token' });
  }
});

/**
 * GET /api/wallet/balance/:address
 * Get wallet balance (STT tokens on Somnia)
 */
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Connect to Somnia network
    const provider = new ethers.JsonRpcProvider(process.env.SOMNIA_RPC_URL);
    
    // Get native balance
    const balance = await provider.getBalance(address);
    const balanceInSTT = ethers.formatEther(balance);

    res.json({
      success: true,
      address,
      balance: balanceInSTT,
      balance_wei: balance.toString()
    });
  } catch (error) {
    logger.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

/**
 * GET /api/wallet/transactions/:address
 * Get wallet transaction history
 */
router.get('/transactions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 20 } = req.query;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Fetch transactions from database
    const result = await db.query(
      `SELECT 
        'chat_unlock' as type, i.tx_hash, i.amount_paid as amount, i.created_at,
        p.name as persona_name
       FROM interactions i
       LEFT JOIN personas p ON i.persona_id = p.id
       WHERE i.user_address = $1
       
       UNION ALL
       
       SELECT 
        'nft_purchase' as type, s.tx_hash, s.price as amount, s.sold_at as created_at,
        p.name as persona_name
       FROM nft_sales s
       LEFT JOIN personas p ON s.persona_id = p.id
       WHERE s.buyer_address = $1 OR s.seller_address = $1
       
       ORDER BY created_at DESC
       LIMIT $2`,
      [address.toLowerCase(), limit]
    );

    res.json({
      success: true,
      transactions: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
