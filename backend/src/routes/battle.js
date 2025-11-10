// backend/src/routes/battle.js
// Battle management endpoints for AI_XANDRIA v2.0
// Built with Amazon Q Developer assistance

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../config/database');

/**
 * POST /api/battle/create
 * Create a new battle between two personas
 * @authenticated
 */
router.post(
  '/create',
  auth,
  [
    body('persona1_id').isUUID().withMessage('Invalid persona1 ID'),
    body('persona2_id').isUUID().withMessage('Invalid persona2 ID'),
    body('topic').isString().trim().isLength({ min: 5, max: 255 }).withMessage('Topic must be 5-255 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { persona1_id, persona2_id, topic } = req.body;

      // Validate personas exist
      const personasCheck = await db.query(
        'SELECT id, name FROM personas WHERE id = ANY($1::uuid[])',
        [[persona1_id, persona2_id]]
      );

      if (personasCheck.rows.length !== 2) {
        return res.status(404).json({ error: 'One or both personas not found' });
      }

      // Create battle
      const result = await db.query(
        `INSERT INTO battles (persona1_id, persona2_id, topic, status, created_at)
         VALUES ($1, $2, $3, 'active', NOW())
         RETURNING *`,
        [persona1_id, persona2_id, topic]
      );

      const battle = result.rows[0];

      logger.info(`Battle created: ${battle.id} - ${topic}`);

      // Generate AI arguments in background (non-blocking)
      generateBattleArguments(battle.id, persona1_id, persona2_id, topic);

      res.status(201).json({
        success: true,
        battle: {
          id: battle.id,
          topic: battle.topic,
          personas: personasCheck.rows,
          status: 'generating_arguments',
          created_at: battle.created_at
        }
      });
    } catch (error) {
      logger.error('Error creating battle:', error);
      res.status(500).json({ error: 'Failed to create battle' });
    }
  }
);

/**
 * GET /api/battle/:id
 * Get battle details with arguments and votes
 */
router.get('/:id', param('id').isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        b.*,
        p1.name as persona1_name, p1.personality as persona1_personality,
        p2.name as persona2_name, p2.personality as persona2_personality,
        (SELECT COUNT(*) FROM battle_votes WHERE battle_id = b.id AND vote_for = 'persona1') as votes_persona1,
        (SELECT COUNT(*) FROM battle_votes WHERE battle_id = b.id AND vote_for = 'persona2') as votes_persona2
       FROM battles b
       LEFT JOIN personas p1 ON b.persona1_id = p1.id
       LEFT JOIN personas p2 ON b.persona2_id = p2.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    res.json({ success: true, battle: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching battle:', error);
    res.status(500).json({ error: 'Failed to fetch battle' });
  }
});

/**
 * POST /api/battle/:id/vote
 * Vote for a winner in a battle
 * @authenticated
 */
router.post(
  '/:id/vote',
  auth,
  [
    param('id').isUUID(),
    body('vote_for').isIn(['persona1', 'persona2']).withMessage('Invalid vote')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { vote_for } = req.body;
      const voter_address = req.user.wallet_address;

      // Check if battle exists and is active
      const battleCheck = await db.query(
        'SELECT status FROM battles WHERE id = $1',
        [id]
      );

      if (battleCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Battle not found' });
      }

      if (battleCheck.rows[0].status !== 'active') {
        return res.status(400).json({ error: 'Battle is not active' });
      }

      // Check if user already voted
      const voteCheck = await db.query(
        'SELECT id FROM battle_votes WHERE battle_id = $1 AND voter_address = $2',
        [id, voter_address]
      );

      if (voteCheck.rows.length > 0) {
        return res.status(400).json({ error: 'You already voted in this battle' });
      }

      // Record vote
      await db.query(
        'INSERT INTO battle_votes (battle_id, voter_address, vote_for, created_at) VALUES ($1, $2, $3, NOW())',
        [id, voter_address, vote_for]
      );

      // Get updated vote counts
      const votesResult = await db.query(
        `SELECT 
          (SELECT COUNT(*) FROM battle_votes WHERE battle_id = $1 AND vote_for = 'persona1') as votes_persona1,
          (SELECT COUNT(*) FROM battle_votes WHERE battle_id = $1 AND vote_for = 'persona2') as votes_persona2`,
        [id]
      );

      logger.info(`Vote recorded for battle ${id} by ${voter_address}`);

      res.json({
        success: true,
        message: 'Vote recorded',
        votes: votesResult.rows[0]
      });
    } catch (error) {
      logger.error('Error recording vote:', error);
      res.status(500).json({ error: 'Failed to record vote' });
    }
  }
);

/**
 * GET /api/battle/:id/arguments
 * Get AI-generated arguments for a battle
 */
router.get('/:id/arguments', param('id').isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const result = await db.query(
      'SELECT persona1_argument, persona2_argument FROM battles WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    const { persona1_argument, persona2_argument } = result.rows[0];

    if (!persona1_argument || !persona2_argument) {
      return res.status(202).json({
        success: true,
        status: 'generating',
        message: 'Arguments are still being generated'
      });
    }

    res.json({
      success: true,
      arguments: {
        persona1: persona1_argument,
        persona2: persona2_argument
      }
    });
  } catch (error) {
    logger.error('Error fetching arguments:', error);
    res.status(500).json({ error: 'Failed to fetch arguments' });
  }
});

/**
 * POST /api/battle/:id/complete
 * End a battle and determine winner
 * @authenticated (admin only)
 */
router.post(
  '/:id/complete',
  auth,
  param('id').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      // Get vote counts
      const votesResult = await db.query(
        `SELECT 
          persona1_id, persona2_id,
          (SELECT COUNT(*) FROM battle_votes WHERE battle_id = $1 AND vote_for = 'persona1') as votes_p1,
          (SELECT COUNT(*) FROM battle_votes WHERE battle_id = $1 AND vote_for = 'persona2') as votes_p2
         FROM battles WHERE id = $1`,
        [id]
      );

      if (votesResult.rows.length === 0) {
        return res.status(404).json({ error: 'Battle not found' });
      }

      const battle = votesResult.rows[0];
      const winner_id = battle.votes_p1 > battle.votes_p2 
        ? battle.persona1_id 
        : battle.persona2_id;

      // Update battle status
      await db.query(
        'UPDATE battles SET status = $1, winner_id = $2, completed_at = NOW() WHERE id = $3',
        ['completed', winner_id, id]
      );

      // Update personas stats
      await db.query(
        'UPDATE personas SET total_battles = total_battles + 1, battle_wins = battle_wins + 1 WHERE id = $1',
        [winner_id]
      );

      const loser_id = winner_id === battle.persona1_id ? battle.persona2_id : battle.persona1_id;
      await db.query(
        'UPDATE personas SET total_battles = total_battles + 1 WHERE id = $1',
        [loser_id]
      );

      logger.info(`Battle ${id} completed. Winner: ${winner_id}`);

      res.json({
        success: true,
        message: 'Battle completed',
        winner_id,
        votes: {
          persona1: parseInt(battle.votes_p1),
          persona2: parseInt(battle.votes_p2)
        }
      });
    } catch (error) {
      logger.error('Error completing battle:', error);
      res.status(500).json({ error: 'Failed to complete battle' });
    }
  }
);

/**
 * GET /api/battle/list
 * List all battles with pagination
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        b.id, b.topic, b.status, b.created_at, b.completed_at,
        p1.name as persona1_name, p2.name as persona2_name,
        (SELECT COUNT(*) FROM battle_votes WHERE battle_id = b.id AND vote_for = 'persona1') as votes_persona1,
        (SELECT COUNT(*) FROM battle_votes WHERE battle_id = b.id AND vote_for = 'persona2') as votes_persona2
      FROM battles b
      LEFT JOIN personas p1 ON b.persona1_id = p1.id
      LEFT JOIN personas p2 ON b.persona2_id = p2.id
    `;

    const params = [];
    if (status !== 'all') {
      query += ' WHERE b.status = $1';
      params.push(status);
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      battles: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount
      }
    });
  } catch (error) {
    logger.error('Error listing battles:', error);
    res.status(500).json({ error: 'Failed to list battles' });
  }
});

/**
 * Helper function to generate battle arguments using Claude API
 * This runs asynchronously after battle creation
 */
async function generateBattleArguments(battleId, persona1Id, persona2Id, topic) {
  try {
    // Fetch personas
    const personasResult = await db.query(
      'SELECT id, name, personality FROM personas WHERE id = ANY($1::uuid[])',
      [[persona1Id, persona2Id]]
    );

    const personas = personasResult.rows;
    const persona1 = personas.find(p => p.id === persona1Id);
    const persona2 = personas.find(p => p.id === persona2Id);

    // Generate arguments using Claude API (via aiService)
    const aiService = require('../services/aiService');
    
    const argument1 = await aiService.generateBattleArgument(persona1, topic, null);
    const argument2 = await aiService.generateBattleArgument(persona2, topic, argument1);

    // Update battle with arguments
    await db.query(
      'UPDATE battles SET persona1_argument = $1, persona2_argument = $2 WHERE id = $3',
      [argument1, argument2, battleId]
    );

    logger.info(`Arguments generated for battle ${battleId}`);
  } catch (error) {
    logger.error(`Error generating arguments for battle ${battleId}:`, error);
  }
}

module.exports = router;
