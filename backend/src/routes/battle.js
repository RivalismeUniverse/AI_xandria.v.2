// backend/src/routes/battle.js
import express from 'express';
import { rateLimit } from '../middleware/rateLimit.js';
import Battle from '../models/Battle.js';
import Persona from '../models/Persona.js';
import AWSBedrockService from '../services/aws-bedrock-service.js';

const router = express.Router();

// Create new battle
router.post('/', rateLimit, async (req, res) => {
  try {
    const { persona1Id, persona2Id, topic } = req.body;

    if (!persona1Id || !persona2Id || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: persona1Id, persona2Id, topic'
      });
    }

    // Get personas
    const persona1 = await Persona.findById(persona1Id);
    const persona2 = await Persona.findById(persona2Id);

    if (!persona1 || !persona2) {
      return res.status(404).json({
        success: false,
        error: 'One or both personas not found'
      });
    }

    // Generate arguments using Bedrock
    const [argument1, argument2] = await Promise.all([
      AWSBedrockService.generateBattleArgument(persona1, topic),
      AWSBedrockService.generateBattleArgument(persona2, topic, argument1?.argument)
    ]);

    // Create battle record
    const battle = await Battle.create({
      persona1Id,
      persona2Id,
      topic,
      arguments: {
        persona1: argument1,
        persona2: argument2
      },
      status: 'active'
    });

    res.status(201).json({
      success: true,
      data: battle,
      message: 'Battle created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create battle',
      message: error.message
    });
  }
});

// Vote on battle
router.post('/:id/vote', rateLimit, async (req, res) => {
  try {
    const { voterWallet, votedFor } = req.body;
    
    if (!voterWallet || !votedFor) {
      return res.status(400).json({
        success: false,
        error: 'Missing voterWallet or votedFor'
      });
    }

    const battle = await Battle.vote(req.params.id, voterWallet, votedFor);

    res.json({
      success: true,
      data: battle,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to record vote'
    });
  }
});

// Get battle results
router.get('/:id/results', rateLimit, async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id);
    
    if (!battle) {
      return res.status(404).json({
        success: false,
        error: 'Battle not found'
      });
    }

    const results = await Battle.calculateResults(req.params.id);

    res.json({
      success: true,
      data: {
        battle,
        results
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get battle results'
    });
  }
});

// Get active battles
router.get('/active', rateLimit, async (req, res) => {
  try {
    const battles = await Battle.findActive();
    
    res.json({
      success: true,
      data: battles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active battles'
    });
  }
});

// Get battle leaderboard
router.get('/leaderboard', rateLimit, async (req, res) => {
  try {
    const { timeframe = 'all-time', limit = 10 } = req.query;
    
    const leaderboard = await Battle.getLeaderboard(timeframe, parseInt(limit));

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

export default router;
