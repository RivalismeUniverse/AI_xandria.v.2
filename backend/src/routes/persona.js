const express = require('express');
const router = express.Router();
const { Persona, User } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/personas
 * Get all personas with pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'elo_rating',
      order = 'DESC',
      search = ''
    } = req.query;

    const offset = (page - 1) * limit;

    const where = search ? {
      name: { [Op.iLike]: `%${search}%` }
    } : {};

    const personas = await Persona.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, order]],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'wallet_address']
      }]
    });

    res.json({
      personas: personas.rows,
      total: personas.count,
      page: parseInt(page),
      totalPages: Math.ceil(personas.count / limit)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/personas/:id
 * Get single persona details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const persona = await Persona.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'wallet_address']
      }]
    });

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    res.json(persona);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/personas
 * Create new persona (requires auth)
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const {
      name,
      description,
      personality,
      expertise,
      intelligence = 50,
      creativity = 50,
      persuasiveness = 50,
      avatar_url
    } = req.body;

    // Validation
    if (!name || !personality) {
      return res.status(400).json({ 
        error: 'Name and personality are required' 
      });
    }

    // Check trait bounds
    const validateTrait = (trait, name) => {
      if (trait < 0 || trait > 100) {
        throw new Error(`${name} must be between 0 and 100`);
      }
    };

    validateTrait(intelligence, 'Intelligence');
    validateTrait(creativity, 'Creativity');
    validateTrait(persuasiveness, 'Persuasiveness');

    const persona = await Persona.create({
      creator_id: req.user.id,
      name,
      description,
      personality,
      expertise: expertise || [],
      intelligence,
      creativity,
      persuasiveness,
      avatar_url
    });

    logger.info('Persona created', {
      personaId: persona.id,
      creatorId: req.user.id,
      name
    });

    res.status(201).json(persona);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/personas/:id
 * Update persona (owner only)
 */
router.put('/:id', auth, async (req, res, next) => {
  try {
    const persona = await Persona.findByPk(req.params.id);

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    // Check ownership
    if (persona.creator_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'You can only edit your own personas' 
      });
    }

    // Can't edit minted NFTs
    if (persona.is_minted) {
      return res.status(400).json({ 
        error: 'Cannot edit minted personas' 
      });
    }

    const {
      name,
      description,
      personality,
      expertise,
      avatar_url
    } = req.body;

    await persona.update({
      name: name || persona.name,
      description: description || persona.description,
      personality: personality || persona.personality,
      expertise: expertise || persona.expertise,
      avatar_url: avatar_url || persona.avatar_url
    });

    logger.info('Persona updated', {
      personaId: persona.id,
      updatedBy: req.user.id
    });

    res.json(persona);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/personas/:id
 * Delete persona (owner only)
 */
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const persona = await Persona.findByPk(req.params.id);

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    // Check ownership
    if (persona.creator_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'You can only delete your own personas' 
      });
    }

    // Can't delete minted NFTs
    if (persona.is_minted) {
      return res.status(400).json({ 
        error: 'Cannot delete minted personas' 
      });
    }

    await persona.destroy();

    logger.info('Persona deleted', {
      personaId: persona.id,
      deletedBy: req.user.id
    });

    res.json({ message: 'Persona deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/personas/:id/stats
 * Get persona statistics
 */
router.get('/:id/stats', async (req, res, next) => {
  try {
    const persona = await Persona.findByPk(req.params.id);

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    const stats = {
      battles: {
        total: persona.total_battles,
        wins: persona.total_wins,
        winRate: persona.total_battles > 0 
          ? (persona.total_wins / persona.total_battles * 100).toFixed(1)
          : 0
      },
      rating: persona.elo_rating,
      chats: persona.total_chats,
      revenue: persona.revenue_earned,
      traits: {
        intelligence: persona.intelligence,
        creativity: persona.creativity,
        persuasiveness: persona.persuasiveness
      }
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/personas/leaderboard
 * Get top personas by ELO rating
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = await Persona.findAll({
      limit: parseInt(limit),
      order: [['elo_rating', 'DESC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['username', 'wallet_address']
      }],
      attributes: [
        'id', 
        'name', 
        'elo_rating', 
        'total_battles', 
        'total_wins',
        'avatar_url'
      ]
    });

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
