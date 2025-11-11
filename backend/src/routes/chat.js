// backend/src/routes/chat.js
import express from 'express';
import { auth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import Chat from '../models/Chat.js';
import Persona from '../models/Persona.js';
import AWSBedrockService from '../services/aws-bedrock-service.js';

const router = express.Router();

// Start chat session
router.post('/sessions', auth, rateLimit, async (req, res) => {
  try {
    const { personaId } = req.body;

    if (!personaId) {
      return res.status(400).json({
        success: false,
        error: 'personaId is required'
      });
    }

    const persona = await Persona.findById(personaId);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    const session = await Chat.createSession({
      personaId,
      userWallet: req.walletAddress,
      personaName: persona.name
    });

    res.status(201).json({
      success: true,
      data: session,
      message: 'Chat session started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start chat session'
    });
  }
});

// Send message
router.post('/sessions/:sessionId/messages', auth, rateLimit, async (req, res) => {
  try {
    const { message } = req.body;
    const { sessionId } = req.params;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const session = await Chat.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    if (session.userWallet !== req.walletAddress) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized for this chat session'
      });
    }

    // Get persona
    const persona = await Persona.findById(session.personaId);

    // Get conversation history
    const history = await Chat.getConversationHistory(sessionId);

    // Generate AI response
    const aiResponse = await AWSBedrockService.generatePersonaResponse(
      persona,
      message,
      history
    );

    // Save both messages
    await Chat.saveMessage(sessionId, 'user', message);
    await Chat.saveMessage(sessionId, 'assistant', aiResponse.response);

    // Update session activity
    await Chat.updateSessionActivity(sessionId);

    res.json({
      success: true,
      data: {
        userMessage: message,
        aiResponse: aiResponse.response,
        usage: aiResponse.usage,
        sessionId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error.message
    });
  }
});

// Get chat history
router.get('/sessions/:sessionId/messages', auth, rateLimit, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const session = await Chat.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    if (session.userWallet !== req.walletAddress) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized for this chat session'
      });
    }

    const messages = await Chat.getConversationHistory(
      sessionId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history'
    });
  }
});

// End chat session
router.post('/sessions/:sessionId/end', auth, rateLimit, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Chat.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    if (session.userWallet !== req.walletAddress) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized for this chat session'
      });
    }

    await Chat.endSession(sessionId);

    res.json({
      success: true,
      message: 'Chat session ended successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to end chat session'
    });
  }
});

// Get user's chat sessions
router.get('/sessions', auth, rateLimit, async (req, res) => {
  try {
    const sessions = await Chat.getUserSessions(req.walletAddress);

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat sessions'
    });
  }
});

export default router;
