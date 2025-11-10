// backend/src/routes/chat.js
// Chat management endpoints for AI_XANDRIA v2.0
// Pay-to-chat system with autonomous AI responses

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../config/database');
const aiService = require('../services/aiService');
const blockchainService = require('../services/blockchainService');

/**
 * POST /api/chat/send
 * Send a message to a persona
 * @authenticated
 */
router.post(
  '/send',
  auth,
  [
    body('persona_id').isUUID().withMessage('Invalid persona ID'),
    body('message').isString().trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { persona_id, message } = req.body;
      const user_address = req.user.wallet_address;

      // Check if user has unlocked chat access
      const accessCheck = await db.query(
        `SELECT id FROM interactions 
         WHERE persona_id = $1 AND user_address = $2 AND chat_unlocked = true AND status = 'confirmed'`,
        [persona_id, user_address]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Chat access locked',
          message: 'Please unlock chat access by paying the unlock fee',
          unlock_required: true
        });
      }

      // Fetch persona
      const personaResult = await db.query(
        'SELECT id, name, personality, memory FROM personas WHERE id = $1',
        [persona_id]
      );

      if (personaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Persona not found' });
      }

      const persona = personaResult.rows[0];

      // Fetch recent chat history for context
      const historyResult = await db.query(
        `SELECT message, response, created_at 
         FROM chat_history 
         WHERE persona_id = $1 AND user_address = $2 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [persona_id, user_address]
      );

      const chatHistory = historyResult.rows.reverse(); // Oldest first

      // Generate AI response
      const response = await aiService.generateChatResponse(
        persona,
        message,
        chatHistory
      );

      // Analyze sentiment
      const sentiment_score = await aiService.analyzeSentiment(message);

      // Save to database
      const chatResult = await db.query(
        `INSERT INTO chat_history (persona_id, user_address, message, response, sentiment_score, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [persona_id, user_address, message, response, sentiment_score]
      );

      // Update persona stats
      await db.query(
        'UPDATE personas SET total_chats = total_chats + 1 WHERE id = $1',
        [persona_id]
      );

      logger.info(`Chat message sent to persona ${persona_id} by ${user_address}`);

      res.json({
        success: true,
        chat: {
          id: chatResult.rows[0].id,
          message,
          response,
          sentiment_score,
          timestamp: chatResult.rows[0].created_at
        }
      });
    } catch (error) {
      logger.error('Error sending chat message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

/**
 * GET /api/chat/:personaId/history
 * Get chat history with a persona
 * @authenticated
 */
router.get(
  '/:personaId/history',
  auth,
  [
    param('personaId').isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { personaId } = req.params;
      const { limit = 50 } = req.query;
      const user_address = req.user.wallet_address;

      // Check if user has access
      const accessCheck = await db.query(
        `SELECT id FROM interactions 
         WHERE persona_id = $1 AND user_address = $2 AND chat_unlocked = true AND status = 'confirmed'`,
        [personaId, user_address]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Chat access locked',
          unlock_required: true
        });
      }

      const result = await db.query(
        `SELECT id, message, response, sentiment_score, created_at
         FROM chat_history
         WHERE persona_id = $1 AND user_address = $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [personaId, user_address, limit]
      );

      res.json({
        success: true,
        history: result.rows.reverse(), // Oldest first for display
        count: result.rows.length
      });
    } catch (error) {
      logger.error('Error fetching chat history:', error);
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  }
);

/**
 * POST /api/chat/unlock
 * Initiate payment to unlock chat access
 * @authenticated
 */
router.post(
  '/unlock',
  auth,
  [
    body('persona_id').isUUID().withMessage('Invalid persona ID'),
    body('tx_hash').isString().withMessage('Transaction hash required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { persona_id, tx_hash } = req.body;
      const user_address = req.user.wallet_address;

      // Check if already unlocked
      const existingAccess = await db.query(
        `SELECT id FROM interactions 
         WHERE persona_id = $1 AND user_address = $2 AND chat_unlocked = true AND status = 'confirmed'`,
        [persona_id, user_address]
      );

      if (existingAccess.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Chat already unlocked for this persona'
        });
      }

      // Verify transaction on blockchain
      const txVerification = await blockchainService.verifyPayment(tx_hash, user_address);

      if (!txVerification.valid) {
        return res.status(400).json({ 
          error: 'Invalid transaction',
          details: txVerification.error
        });
      }

      // Get persona owner for revenue split
      const personaResult = await db.query(
        'SELECT owner_address FROM personas WHERE id = $1',
        [persona_id]
      );

      if (personaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Persona not found' });
      }

      const owner_address = personaResult.rows[0].owner_address;

      // Record interaction
      const interactionResult = await db.query(
        `INSERT INTO interactions (
          persona_id, user_address, tx_hash, amount_paid, status, chat_unlocked, created_at
        ) VALUES ($1, $2, $3, $4, 'confirmed', true, NOW())
        RETURNING *`,
        [persona_id, user_address, tx_hash, txVerification.amount]
      );

      // Process revenue split (80% creator, 20% platform)
      await blockchainService.distributeRevenue(
        txVerification.amount,
        owner_address,
        user_address
      );

      logger.info(`Chat unlocked for persona ${persona_id} by ${user_address}`);

      res.json({
        success: true,
        message: 'Chat access unlocked',
        interaction: interactionResult.rows[0]
      });
    } catch (error) {
      logger.error('Error unlocking chat:', error);
      res.status(500).json({ error: 'Failed to unlock chat access' });
    }
  }
);

/**
 * GET /api/chat/:personaId/status
 * Check if user has unlocked chat access
 * @authenticated
 */
router.get(
  '/:personaId/status',
  auth,
  param('personaId').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { personaId } = req.params;
      const user_address = req.user.wallet_address;

      const result = await db.query(
        `SELECT id, amount_paid, created_at 
         FROM interactions 
         WHERE persona_id = $1 AND user_address = $2 AND chat_unlocked = true AND status = 'confirmed'`,
        [personaId, user_address]
      );

      const isUnlocked = result.rows.length > 0;

      res.json({
        success: true,
        unlocked: isUnlocked,
        details: isUnlocked ? result.rows[0] : null
      });
    } catch (error) {
      logger.error('Error checking chat status:', error);
      res.status(500).json({ error: 'Failed to check chat status' });
    }
  }
);

/**
 * GET /api/chat/stats/:personaId
 * Get chat statistics for a persona
 */
router.get(
  '/stats/:personaId',
  param('personaId').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { personaId } = req.params;

      const stats = await db.query(
        `SELECT 
          COUNT(*) as total_messages,
          COUNT(DISTINCT user_address) as unique_users,
          AVG(sentiment_score) as avg_sentiment,
          MAX(created_at) as last_message_at
         FROM chat_history
         WHERE persona_id = $1`,
        [personaId]
      );

      const unlocks = await db.query(
        `SELECT COUNT(*) as total_unlocks, SUM(amount_paid) as total_revenue
         FROM interactions
         WHERE persona_id = $1 AND chat_unlocked = true AND status = 'confirmed'`,
        [personaId]
      );

      res.json({
        success: true,
        stats: {
          ...stats.rows[0],
          ...unlocks.rows[0]
        }
      });
    } catch (error) {
      logger.error('Error fetching chat stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }
);

/**
 * DELETE /api/chat/:personaId/clear
 * Clear chat history with a persona
 * @authenticated
 */
router.delete(
  '/:personaId/clear',
  auth,
  param('personaId').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { personaId } = req.params;
      const user_address = req.user.wallet_address;

      const result = await db.query(
        'DELETE FROM chat_history WHERE persona_id = $1 AND user_address = $2',
        [personaId, user_address]
      );

      logger.info(`Chat history cleared for persona ${personaId} by ${user_address}`);

      res.json({
        success: true,
        message: 'Chat history cleared',
        deleted_count: result.rowCount
      });
    } catch (error) {
      logger.error('Error clearing chat history:', error);
      res.status(500).json({ error: 'Failed to clear chat history' });
    }
  }
);

module.exports = router;
