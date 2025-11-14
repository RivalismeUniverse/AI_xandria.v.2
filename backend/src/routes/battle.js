const express = require('express');
const router = express.Router();
const { Battle, Persona, BattleVote, User } = require('../models');
const bedrockService = require('../services/aws-bedrock-service');
const evolutionService = require('../services/evolutionService');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler'); // ✅ Add this
const logger = require('../utils/logger');

/**
 * POST /api/battles
 */
router.post('/', auth, asyncHandler(async (req, res) => {
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

  const [persona1, persona2] = await Promise.all([
    Persona.findByPk(persona1_id),
    Persona.findByPk(persona2_id)
  ]);

  if (!persona1 || !persona2) {
    return res.status(404).json({ error: 'One or both personas not found' });
  }

  const battle = await Battle.create({
    persona1_id,
    persona2_id,
    topic,
    status: 'pending'
  });

  // Generate arguments asynchronously (don't await)
  generateBattleArguments(battle.id, persona1, persona2, topic).catch(err => {
    logger.error('Background argument generation failed', { battleId: battle.id, error: err });
  });

  logger.info('Battle created', {
    battleId: battle.id,
    persona1: persona1.name,
    persona2: persona2.name,
    topic
  });

  res.status(201).json(battle);
}));

/**
 * Background task: Generate AI arguments
 */
async function generateBattleArguments(battleId, persona1, persona2, topic) {
  try {
    const arg1 = await bedrockService.generateBattleArgument(persona1, topic);
    const arg2 = await bedrockService.generateBattleArgument(persona2, topic, arg1);

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
 */
router.get('/', asyncHandler(async (req, res) => {
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
}));

/**
 * GET /api/battles/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
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
}));

/**
 * POST /api/battles/:id/vote
 */
router.post('/:id/vote', auth, asyncHandler(async (req, res) => {
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

  if (voted_for !== battle.persona1_id && voted_for !== battle.persona2_id) {
    return res.status(400).json({
      error: 'Invalid persona for this battle'
    });
  }

  const existingVote = await BattleVote.findOne({
    where: {
      battle_id: battleId,
      voter_id: req.user.id
    }
  });

  if (existingVote) {
    return res.status(400).json({ error: 'You already voted in this battle' });
  }

  await BattleVote.create({
    battle_id: battleId,
    voter_id: req.user.id,
    voted_for
  });

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
}));

/**
 * POST /api/battles/:id/complete
 */
router.post('/:id/complete', auth, asyncHandler(async (req, res) => {
  const battle = await Battle.findByPk(req.params.id, {
    include: ['persona1', 'persona2']
  });

  if (!battle) {
    return res.status(404).json({ error: 'Battle not found' });
  }

  if (battle.status === 'completed') {
    return res.status(400).json({ error: 'Battle already completed' });
  }

  const winner_id = battle.persona1_votes > battle.persona2_votes
    ? battle.persona1_id
    : battle.persona2_id;

  battle.winner_id = winner_id;
  battle.status = 'completed';
  battle.completed_at = new Date();
  await battle.save();

  await Persona.increment('total_battles', {
    where: { id: [battle.persona1_id, battle.persona2_id] }
  });
  await Persona.increment('total_wins', {
    where: { id: winner_id }
  });

  // Trigger evolution (don't await)
  evolutionService.evolveBattlePersonas(battle).catch(err => {
    logger.error('Evolution failed', { battleId: battle.id, error: err });
  });

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
}));

module.exports = router;
