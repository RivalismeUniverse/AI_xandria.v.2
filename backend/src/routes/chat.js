const express = require('express');
const router = express.Router();
const AWSBedrockService = require('../services/aws-bedrock-service');
const BlockchainService = require('../services/blockchainService');
const { Persona, User } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Chat with persona
router.post('/:personaId/chat', auth, async (req, res) => {
  try {
    const { personaId } = req.params;
    const { message, conversationHistory = [] } = req.body;
    const walletAddress = req.walletAddress;

    const persona = await Persona.findByPk(personaId);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    // Check if rental required
    if (persona.is_rentable && persona.owner_address !== walletAddress) {
      const isRented = await checkRentalStatus(persona.id, walletAddress);
      if (!isRented) {
        return res.status(402).json({
          success: false,
          error: 'Payment required to chat with this persona',
          rentalPrice: persona.rental_price
        });
      }
    }

    // Process chat with AWS Bedrock
    const chatResult = await AWSBedrockService.chatWithPersona(
      persona,
      message,
      conversationHistory
    );

    // Log chat interaction for analytics
    await logChatInteraction(persona.id, walletAddress, message.length);

    // Update user stats
    await User.increment('total_spent', {
      by: persona.is_rentable ? persona.rental_price : 0,
      where: { wallet_address: walletAddress }
    });

    if (persona.owner_address !== walletAddress) {
      await User.increment('total_earnings', {
        by: persona.is_rentable ? persona.rental_price * 0.8 : 0,
        where: { wallet_address: persona.owner_address }
      });
    }

    res.json({
      success: true,
      response: chatResult.response,
      conversationId: chatResult.conversationId,
      usage: chatResult.usage,
      persona: {
        id: persona.id,
        name: persona.name,
        traits: persona.traits
      }
    });

  } catch (error) {
    logger.error('Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Process voice chat
router.post('/:personaId/voice-chat', auth, async (req, res) => {
  try {
    const { personaId } = req.params;
    const { audioBuffer } = req.body;
    const walletAddress = req.walletAddress;

    const persona = await Persona.findByPk(personaId);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    // Process voice input (would integrate with voice service)
    const voiceResult = {
      text: "This is a simulated voice transcription for the hackathon demo.",
      confidence: 0.92
    };

    // Continue with normal chat
    const chatResult = await AWSBedrockService.chatWithPersona(
      persona,
      voiceResult.text
    );

    // Generate voice response (simulated)
    const voiceResponse = {
      audioUrl: `https://ai-xandria.s3.amazonaws.com/voice-responses/${Date.now()}.mp3`,
      duration: 2.5
    };

    res.json({
      success: true,
      input: {
        text: voiceResult.text,
        confidence: voiceResult.confidence
      },
      output: {
        text: chatResult.response,
        audio: voiceResponse
      },
      persona: {
        id: persona.id,
        name: persona.name
      }
    });

  } catch (error) {
    logger.error('Voice Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get chat history (simplified for hackathon)
router.get('/:personaId/history', auth, async (req, res) => {
  try {
    const { personaId } = req.params;
    const walletAddress = req.walletAddress;

    // In a real implementation, you'd fetch from a conversations table
    // For hackathon, return mock data
    const mockHistory = [
      {
        role: 'user',
        content: 'Hello! Can you help me understand AI ethics?',
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        role: 'assistant',
        content: 'Of course! AI ethics is a fascinating topic that deals with the moral implications of artificial intelligence systems...',
        timestamp: new Date(Date.now() - 240000).toISOString()
      }
    ];

    res.json({
      success: true,
      history: mockHistory,
      personaId,
      hasMore: false
    });

  } catch (error) {
    logger.error('Chat History Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Process payment for chat access
router.post('/:personaId/pay', auth, async (req, res) => {
  try {
    const { personaId } = req.params;
    const { duration = 30 } = req.body; // days
    const walletAddress = req.walletAddress;

    const persona = await Persona.findByPk(personaId);
    
    if (!persona || !persona.is_rentable) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found or not available for rent'
      });
    }

    if (persona.owner_address === walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'You cannot rent your own persona'
      });
    }

    // Process payment on blockchain
    const paymentResult = await BlockchainService.rentPersona(
      walletAddress,
      persona.token_id,
      duration
    );

    // Create rental record (simplified for hackathon)
    const rentalRecord = {
      personaId: persona.id,
      renterAddress: walletAddress,
      startTime: new Date(),
      endTime: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      amount: persona.rental_price * duration
    };

    logger.info('Rental Payment Processed', rentalRecord);

    res.json({
      success: true,
      rental: rentalRecord,
      payment: paymentResult,
      accessGranted: true
    });

  } catch (error) {
    logger.error('Payment Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions
async function checkRentalStatus(personaId, walletAddress) {
  // In a real implementation, check blockchain for active rental
  // For hackathon, return true for demo purposes
  return true;
}

async function logChatInteraction(personaId, walletAddress, messageLength) {
  // Log chat for analytics and evolution
  logger.info('Chat Interaction', {
    personaId,
    walletAddress,
    messageLength,
    timestamp: new Date().toISOString()
  });
}

module.exports = router;
