const express = require('express');
const router = express.Router();
const VoiceService = require('../services/voice-service');
const AWSBedrockService = require('../services/aws-bedrock-service');
const { Persona } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Widget health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Process voice command from mobile widget
router.post('/voice-command', auth, async (req, res) => {
  try {
    const { audioBuffer, personaId, commandType } = req.body;
    const walletAddress = req.walletAddress;

    let persona;
    if (personaId) {
      persona = await Persona.findByPk(personaId);
    }

    // Process voice command
    const voiceResult = await VoiceService.processVoiceCommand(audioBuffer, persona);

    // Execute command based on type
    let commandResult;
    switch (voiceResult.commandType) {
      case 'battle':
        commandResult = await handleBattleCommand(voiceResult.text, walletAddress);
        break;
      case 'creation':
        commandResult = await handleCreationCommand(voiceResult.text, walletAddress);
        break;
      case 'marketplace':
        commandResult = await handleMarketplaceCommand(voiceResult.text, walletAddress);
        break;
      default:
        commandResult = await handleChatCommand(voiceResult.text, persona, walletAddress);
    }

    // Generate voice response if needed
    let voiceResponse;
    if (commandResult.generateVoice) {
      voiceResponse = await VoiceService.generateVoiceResponse(commandResult.response);
    }

    res.json({
      success: true,
      command: {
        type: voiceResult.commandType,
        input: voiceResult.text,
        confidence: voiceResult.confidence
      },
      result: commandResult,
      voiceResponse: voiceResponse || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Voice Command Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get widget configuration
router.get('/config', auth, async (req, res) => {
  try {
    const walletAddress = req.walletAddress;

    // Get user's active personas for widget
    const personas = await Persona.findAll({
      where: { 
        owner_address: walletAddress,
        is_active: true
      },
      attributes: ['id', 'name', 'traits', 'rating'],
      limit: 10
    });

    const widgetConfig = {
      user: {
        walletAddress,
        availablePersonas: personas.length
      },
      features: {
        voiceCommands: true,
        backgroundOperation: true,
        battleAccess: true,
        marketplaceAccess: true
      },
      settings: {
        autoListen: false,
        responseVoice: 'en-US-Joanna',
        notificationEnabled: true
      },
      quickActions: [
        { action: 'battle', label: 'Start Battle', icon: '⚔️' },
        { action: 'create', label: 'Create Persona', icon: '🤖' },
        { action: 'marketplace', label: 'Browse NFTs', icon: '🎨' },
        { action: 'chat', label: 'Quick Chat', icon: '💬' }
      ]
    };

    res.json({
      success: true,
      config: widgetConfig
    });

  } catch (error) {
    logger.error('Widget Config Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Background sync for widget
router.post('/sync', auth, async (req, res) => {
  try {
    const { lastSync, personaIds } = req.body;
    const walletAddress = req.walletAddress;

    const updates = {
      personas: [],
      battles: [],
      notifications: []
    };

    // Get updated personas
    if (personaIds && personaIds.length > 0) {
      const personas = await Persona.findAll({
        where: { 
          id: personaIds,
          owner_address: walletAddress
        },
        attributes: ['id', 'name', 'traits', 'rating', 'battle_wins', 'battle_losses']
      });
      updates.personas = personas;
    }

    // Get recent battles (simplified)
    updates.battles = await getRecentBattles(walletAddress);

    // Get notifications (simplified)
    updates.notifications = [
      {
        id: 1,
        type: 'battle_result',
        title: 'Battle Completed',
        message: 'Your persona TechMaster won against AIHelper!',
        timestamp: new Date().toISOString(),
        read: false
      }
    ];

    res.json({
      success: true,
      updates,
      currentTime: new Date().toISOString(),
      hasMore: false
    });

  } catch (error) {
    logger.error('Widget Sync Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Quick action processing
router.post('/quick-action', auth, async (req, res) => {
  try {
    const { action, parameters = {} } = req.body;
    const walletAddress = req.walletAddress;

    let result;

    switch (action) {
      case 'battle':
        result = await handleQuickBattle(walletAddress, parameters);
        break;
      case 'create':
        result = await handleQuickCreation(walletAddress, parameters);
        break;
      case 'marketplace':
        result = await handleQuickMarketplace(walletAddress, parameters);
        break;
      case 'chat':
        result = await handleQuickChat(walletAddress, parameters);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    res.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Quick Action Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions for command handling
async function handleBattleCommand(text, walletAddress) {
  // Extract topic and persona from voice command
  const topic = extractTopicFromText(text);
  const personaId = await getDefaultPersona(walletAddress);

  return {
    action: 'battle_created',
    topic,
    personaId,
    response: `Starting battle about "${topic}" with your default persona.`,
    generateVoice: true
  };
}

async function handleCreationCommand(text, walletAddress) {
  const prompt = extractCreationPrompt(text);
  
  return {
    action: 'persona_creation_started',
    prompt,
    response: `Creating new AI persona with prompt: "${prompt}"`,
    generateVoice: true
  };
}

async function handleMarketplaceCommand(text, walletAddress) {
  const intent = extractMarketplaceIntent(text);
  
  return {
    action: 'marketplace_navigation',
    intent,
    response: `Taking you to the marketplace to ${intent}.`,
    generateVoice: true
  };
}

async function handleChatCommand(text, persona, walletAddress) {
  if (!persona) {
    persona = await getDefaultPersona(walletAddress);
  }

  const chatResult = await AWSBedrockService.chatWithPersona(persona, text);

  return {
    action: 'chat_response',
    response: chatResult.response,
    personaId: persona.id,
    generateVoice: true
  };
}

// Quick action handlers
async function handleQuickBattle(walletAddress, parameters) {
  const defaultPersona = await getDefaultPersona(walletAddress);
  const randomTopics = [
    "The future of AI in education",
    "Ethical implications of advanced AI",
    "Human-AI collaboration in creative work"
  ];
  
  const topic = parameters.topic || randomTopics[Math.floor(Math.random() * randomTopics.length)];

  return {
    battleId: `battle_${Date.now()}`,
    topic,
    personaId: defaultPersona.id,
    status: 'searching_opponent'
  };
}

async function handleQuickCreation(walletAddress, parameters) {
  const prompt = parameters.prompt || "Create a helpful AI assistant for learning programming";
  
  return {
    creationId: `create_${Date.now()}`,
    prompt,
    status: 'generating',
    estimatedTime: '30 seconds'
  };
}

async function handleQuickMarketplace(walletAddress, parameters) {
  const filter = parameters.filter || 'trending';
  
  return {
    view: 'marketplace',
    filter,
    results: await getQuickMarketplaceListings(filter)
  };
}

async function handleQuickChat(walletAddress, parameters) {
  const persona = await getDefaultPersona(walletAddress);
  const message = parameters.message || "Hello! How can you help me today?";
  
  const chatResult = await AWSBedrockService.chatWithPersona(persona, message);

  return {
    response: chatResult.response,
    personaId: persona.id,
    messageCount: 1
  };
}

// Utility functions
async function getDefaultPersona(walletAddress) {
  const persona = await Persona.findOne({
    where: { owner_address: walletAddress },
    order: [['rating', 'DESC']]
  });

  if (!persona) {
    throw new Error('No personas found. Create a persona first.');
  }

  return persona;
}

async function getRecentBattles(walletAddress) {
  // Simplified for hackathon
  return [
    {
      id: 'battle_123',
      topic: 'AI Ethics',
      result: 'win',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ];
}

async function getQuickMarketplaceListings(filter) {
  // Simplified for hackathon
  return [
    {
      id: 1,
      name: 'Tech Mentor Pro',
      rating: 4.8,
      price: '10 STT/day',
      traits: { intelligence: 85, creativity: 70 }
    }
  ];
}

function extractTopicFromText(text) {
  const topics = {
    'education': 'The future of AI in education',
    'ethics': 'Ethical implications of advanced AI',
    'creativity': 'Human-AI collaboration in creative work'
  };

  for (const [key, topic] of Object.entries(topics)) {
    if (text.toLowerCase().includes(key)) {
      return topic;
    }
  }

  return 'The impact of artificial intelligence on society';
}

function extractCreationPrompt(text) {
  if (text.includes('teacher') || text.includes('educate')) {
    return 'Create an AI persona that is an expert educator who can explain complex topics in simple terms';
  } else if (text.includes('creative') || text.includes('artist')) {
    return 'Create a creative AI persona that helps with artistic inspiration and creative thinking';
  } else {
    return 'Create a helpful AI assistant for general knowledge and daily tasks';
  }
}

function extractMarketplaceIntent(text) {
  if (text.includes('rent') || text.includes('lease')) {
    return 'rent personas';
  } else if (text.includes('buy') || text.includes('purchase')) {
    return 'buy NFTs';
  } else {
    return 'browse available personas';
  }
}

module.exports = router;
