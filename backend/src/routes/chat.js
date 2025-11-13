const express = require('express');
const router = express.Router();
const { ChatSession, ChatMessage, Persona, User } = require('../models');
const bedrockService = require('../services/aws-bedrock-service');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errorHandler');

/**
 * POST /api/chat/unlock
 * Unlock chat with persona (requires payment)
 */
router.post('/unlock', auth, async (req, res, next) => {
  try {
    const { persona_id, payment_tx_hash, amount_paid } = req.body;

    if (!persona_id || !payment_tx_hash) {
      throw new ValidationError('persona_id and payment_tx_hash required');
    }

    const persona = await Persona.findByPk(persona_id);
    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    // TODO: Verify payment on blockchain
    // For now, trust the tx_hash

    // Create paid chat session
    const session = await ChatSession.create({
      user_id: req.user.id,
      persona_id,
      payment_tx_hash,
      amount_paid: amount_paid || 0.1,
      is_paid: true
    });

    // Update persona stats
    await persona.increment('total_chats');
    
    // Calculate revenue (80% to creator)
    const creatorRevenue = parseFloat(amount_paid || 0.1) * 0.8;
    await persona.increment('revenue_earned', { by: creatorRevenue });
    await User.increment('total_revenue', { 
      by: creatorRevenue,
      where: { id: persona.creator_id }
    });

    logger.logPayment(req.user.id, persona_id, amount_paid, payment_tx_hash);

    res.status(201).json({
      session_id: session.id,
      message: 'Chat unlocked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/chat/sessions
 * Get user's chat sessions
 */
router.get('/sessions', auth, async (req, res, next) => {
  try {
    const sessions = await ChatSession.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Persona,
        as: 'persona',
        attributes: ['id', 'name', 'avatar_url']
      }],
      order: [['last_message_at', 'DESC']]
    });

    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/chat/sessions/:id
 * Get specific chat session
 */
router.get('/sessions/:id', auth, async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      },
      include: [{
        model: Persona,
        as: 'persona'
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/chat/sessions/:id/messages
 * Get chat messages
 */
router.get('/sessions/:id/messages', auth, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Verify session ownership
    const session = await ChatSession.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = await ChatMessage.findAll({
      where: { session_id: req.params.id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/chat/sessions/:id/messages
 * Send message to AI persona
 */
router.post('/sessions/:id/messages', auth, async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      throw new ValidationError('Message content required');
    }

    // Get session
    const session = await ChatSession.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      },
      include: [{
        model: Persona,
        as: 'persona'
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.is_paid) {
      return res.status(403).json({ 
        error: 'Payment required',
        message: 'Please unlock chat first'
      });
    }

    // Save user message
    const userMessage = await ChatMessage.create({
      session_id: session.id,
      role: 'user',
      content
    });

    // Get conversation history (last 10 messages)
    const history = await ChatMessage.findAll({
      where: { session_id: session.id },
      limit: 10,
      order: [['created_at', 'DESC']]
    });

    // Generate AI response using Bedrock
    const aiResponse = await bedrockService.generateChatResponse(
      session.persona,
      history.reverse(),
      content
    );

    // Save AI message
    const assistantMessage = await ChatMessage.create({
      session_id: session.id,
      role: 'assistant',
      content: aiResponse
    });

    // Update session
    await session.update({
      message_count: session.message_count + 2,
      last_message_at: new Date()
    });

    logger.info('Chat message exchanged', {
      sessionId: session.id,
      personaId: session.persona.id,
      messageCount: session.message_count
    });

    res.json({
      user_message: userMessage,
      assistant_message: assistantMessage
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/chat/sessions/:id
 * Delete chat session
 */
router.delete('/sessions/:id', auth, async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Delete all messages first
    await ChatMessage.destroy({
      where: { session_id: session.id }
    });

    // Delete session
    await session.destroy();

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
