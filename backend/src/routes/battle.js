const express = require('express');
const router = express.Router();
const { Battle, Persona, BattleVote, User } = require('../models');
const bedrockService = require('../services/aws-bedrock-service');
const evolutionService = require('../services/evolutionService');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * POST /api/battles
 * Create new battle between two personas
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const { persona1_id, persona2_id, topic } = req.body;

    if (!persona1_id || !persona2_id || !topic) {
      return res.status(400).json({ 
        error: 'persona1_id, persona2_id, and topic are required' 
      });
    }

    if (persona1_id === persona2_id) {
      return res.status(400).json({ 
        error: 'Cannot battle a persona against itself' 
      });
    }

    // Fetch personas
    const [persona1, persona2] = await Promise.all([
      Persona.findByPk(persona1_id),
      Persona.findByPk(persona2_id)
    ]);

    if (!persona1 || !persona2) {
      return res.status(404).json({ error: 'One or both personas not found' });
    }

    // Create battle
    const battle = await Battle.create({
      persona1_id,
      persona2_id,
      topic,
      status: 'pending'
    });

    // Generate arguments asynchronously
    generateBattleArguments(battle.id, persona1, persona2, topic);

    logger.info('Battle created', {
      battleId: battle.id,
      persona1: persona1.name,
      persona2: persona2.name,
      topic
    });

    res.status(201).json(battle);
  } catch (error) {
    next(error);
  }
});

/**
 * Background task: Generate AI arguments using Bedrock
 */
async function generateBattleArguments(battleId, persona1, persona2, topic) {
  try {
    // Persona 1 opens
    const arg1 = await bedrockService.generateBattleArgument(
      persona1, 
      topic
    );

    // Persona 2 responds
    const arg2 = await bedrockService.generateBattleArgument(
      persona2, 
      topic, 
      arg1
    );

    // Update battle
    await Battle.update({
      persona1_argument: arg1,
      persona2_argument: arg2,
      status: 'voting'
    }, {
      where: { id: battleId }
    });

    logger.info('Battle arguments generated', { battleId });
  } catch (error) {
    logger.error('Failed to generate battle arguments', { battleId, error });
    await Battle.update({ status: 'failed' }, { where: { id: battleId } });
  }
}

/**
 * GET /api/battles
 * List all battles
 */
router.get('/', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'all' 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = status !== 'all' ? { status } : {};

    const battles = await Battle.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['started_at', 'DESC']],
      include: [
        {
          model: Persona,
          as: 'persona1',
          attributes: ['id', 'name', 'avatar_url']
        },
        {
          model: Persona,
          as: 'persona2',
          attributes: ['id', 'name', 'avatar_url']
        }
      ]
    });

    res.json({
      battles: battles.rows,
      total: battles.count,
      page: parseInt(page),
      totalPages: Math.ceil(battles.count / limit)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/battles/:id
 * Get battle details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const battle = await Battle.findByPk(req.params.id, {
      include: [
        {
          model: Persona,
          as: 'persona1',
          include: [{
            model: User,
            as: 'creator',
            attributes: ['username']
          }]
        },
        {
          model: Persona,
          as: 'persona2',
          include: [{
            model: User,
            as: 'creator',
            attributes: ['username']
          }]
        }
      ]
    });

    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    res.json(battle);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/battles/:id/vote
 * Vote for a persona in battle
 */
router.post('/:id/vote', auth, async (req, res, next) => {
  try {
    const { voted_for } = req.body;
    const battleId = req.params.id;

    if (!voted_for) {
      return res.status(400).json({ error: 'voted_for is required' });
    }

    const battle = await Battle.findByPk(battleId);

    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (battle.status !== 'voting') {
      return res.status(400).json({ 
        error: 'Battle is not open for voting' 
      });
    }

    // Check if persona is in this battle
    if (voted_for !== battle.persona1_id && voted_for !== battle.persona2_id) {
      return res.status(400).json({ 
        error: 'Invalid persona for this battle' 
      });
    }

    // Check if user already voted
    const existingVote = await BattleVote.findOne({
      where: {
        battle_id: battleId,
        voter_id: req.user.id
      }
    });

    if (existingVote) {
      return res.status(400).json({ error: 'You already voted in this battle' });
    }

    // Create vote
    await BattleVote.create({
      battle_id: battleId,
      voter_id: req.user.id,
      voted_for
    });

    // Update vote counts
    if (voted_for === battle.persona1_id) {
      battle.persona1_votes += 1;
    } else {
      battle.persona2_votes += 1;
    }

    await battle.save();

    logger.info('Vote cast', {
      battleId,
      voterId: req.user.id,
      votedFor: voted_for
    });

    res.json({ 
      message: 'Vote recorded',
      persona1_votes: battle.persona1_votes,
      persona2_votes: battle.persona2_votes
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/battles/:id/complete
 * Complete battle and trigger evolution
 */
router.post('/:id/complete', auth, async (req, res, next) => {
  try {
    const battle = await Battle.findByPk(req.params.id, {
      include: ['persona1', 'persona2']
    });

    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (battle.status === 'completed') {
      return res.status(400).json({ error: 'Battle already completed' });
    }

    // Determine winner
    const winner_id = battle.persona1_votes > battle.persona2_votes
      ? battle.persona1_id
      : battle.persona2_id;

    // Update battle
    battle.winner_id = winner_id;
    battle.status = 'completed';
    battle.completed_at = new Date();
    await battle.save();

    // Update persona stats
    await Persona.increment('total_battles', {
      where: { id: [battle.persona1_id, battle.persona2_id] }
    });

    await Persona.increment('total_wins', {
      where: { id: winner_id }
    });

    // Trigger evolution
    await evolutionService.evolveBattlePersonas(battle);

    logger.info('Battle completed', {
      battleId: battle.id,
      winnerId: winner_id
    });

    res.json({
      message: 'Battle completed',
      winner_id,
      persona1_votes: battle.persona1_votes,
      persona2_votes: battle.persona2_votes
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
