const express = require('express');
const router = express.Router();
const AWSBedrockService = require('../services/aws-bedrock-service');
const EvolutionService = require('../services/evolutionService');
const { Battle, Persona } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Create new battle
router.post('/create', auth, async (req, res) => {
  try {
    const { topic, persona1_id, persona2_id } = req.body;
    const walletAddress = req.walletAddress;

    // Verify personas exist
    const persona1 = await Persona.findByPk(persona1_id);
    const persona2 = await Persona.findByPk(persona2_id);

    if (!persona1 || !persona2) {
      return res.status(404).json({
        success: false,
        error: 'One or both personas not found'
      });
    }

    // Create battle
    const battle = await Battle.create({
      topic,
      persona1_id,
      persona2_id,
      created_by: walletAddress,
      status: 'active',
      start_time: new Date()
    });

    // Generate initial arguments
    const [argument1, argument2] = await Promise.all([
      AWSBedrockService.generateBattleArgument(persona1, topic),
      AWSBedrockService.generateBattleArgument(persona2, topic)
    ]);

    // Update battle with initial arguments
    await battle.update({
      arguments: {
        persona1: [argument1.argument],
        persona2: [argument2.argument]
      }
    });

    logger.info('Battle Created', {
      battleId: battle.id,
      topic,
      personas: [persona1_id, persona2_id]
    });

    res.json({
      success: true,
      battle: {
        ...battle.toJSON(),
        persona1_name: persona1.name,
        persona2_name: persona2.name
      }
    });

  } catch (error) {
    logger.error('Battle Creation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get battle by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const battle = await Battle.findByPk(id, {
      include: [
        { model: Persona, as: 'persona1', attributes: ['id', 'name', 'traits'] },
        { model: Persona, as: 'persona2', attributes: ['id', 'name', 'traits'] }
      ]
    });

    if (!battle) {
      return res.status(404).json({
        success: false,
        error: 'Battle not found'
      });
    }

    res.json({
      success: true,
      battle: battle.toJSON()
    });

  } catch (error) {
    logger.error('Get Battle Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Vote on battle
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { winner_id } = req.body;
    const walletAddress = req.walletAddress;

    const battle = await Battle.findByPk(id);
    
    if (!battle) {
      return res.status(404).json({
        success: false,
        error: 'Battle not found'
      });
    }

    if (battle.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Battle is not active'
      });
    }

    // Update votes
    const votes = battle.votes || { persona1: 0, persona2: 0 };
    
    if (winner_id === battle.persona1_id) {
      votes.persona1 += 1;
    } else if (winner_id === battle.persona2_id) {
      votes.persona2 += 1;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid winner ID'
      });
    }

    await battle.update({ votes });

    // Check if battle should end (e.g., after 10 votes)
    const totalVotes = votes.persona1 + votes.persona2;
    if (totalVotes >= 10) {
      await this.finalizeBattle(battle);
    }

    logger.info('Vote Cast', {
      battleId: id,
      voter: walletAddress,
      winner: winner_id,
      currentVotes: votes
    });

    res.json({
      success: true,
      votes,
      totalVotes
    });

  } catch (error) {
    logger.error('Vote Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate next argument in battle
router.post('/:id/next-argument', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { persona_id } = req.body;

    const battle = await Battle.findByPk(id);
    const persona = await Persona.findByPk(persona_id);

    if (!battle || !persona) {
      return res.status(404).json({
        success: false,
        error: 'Battle or persona not found'
      });
    }

    // Get last argument from opponent
    const arguments = battle.arguments;
    const isPersona1 = persona_id === battle.persona1_id;
    const opponentArguments = isPersona1 ? arguments.persona2 : arguments.persona1;
    const lastOpponentArg = opponentArguments[opponentArguments.length - 1];

    // Generate counter-argument
    const newArgument = await AWSBedrockService.generateBattleArgument(
      persona,
      battle.topic,
      lastOpponentArg
    );

    // Update battle arguments
    if (isPersona1) {
      arguments.persona1.push(newArgument.argument);
    } else {
      arguments.persona2.push(newArgument.argument);
    }

    await battle.update({ arguments });

    res.json({
      success: true,
      argument: newArgument.argument,
      argumentIndex: isPersona1 ? arguments.persona1.length - 1 : arguments.persona2.length - 1
    });

  } catch (error) {
    logger.error('Next Argument Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get active battles
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const battles = await Battle.findAll({
      where: { status: 'active' },
      include: [
        { model: Persona, as: 'persona1', attributes: ['id', 'name', 'traits', 'rating'] },
        { model: Persona, as: 'persona2', attributes: ['id', 'name', 'traits', 'rating'] }
      ],
      order: [['start_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      battles: battles.map(b => b.toJSON()),
      total: battles.length
    });

  } catch (error) {
    logger.error('Get Battles Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper method to finalize battle
async function finalizeBattle(battle) {
  try {
    const votes = battle.votes;
    let winner_id = null;

    if (votes.persona1 > votes.persona2) {
      winner_id = battle.persona1_id;
    } else if (votes.persona2 > votes.persona1) {
      winner_id = battle.persona2_id;
    }
    // tie = no winner

    await battle.update({
      status: 'completed',
      winner_id,
      end_time: new Date()
    });

    // Update persona stats and evolve traits
    if (winner_id) {
      const winner = await Persona.findByPk(winner_id);
      const loser = await Persona.findByPk(
        winner_id === battle.persona1_id ? battle.persona2_id : battle.persona1_id
      );

      if (winner && loser) {
        await winner.increment('battle_wins');
        await loser.increment('battle_losses');

        // Evolve traits based on battle outcome
        const winnerPerformance = {
          battleResults: [{ won: true }],
          battleWins: winner.battle_wins + 1,
          battleLosses: winner.battle_losses
        };

        const loserPerformance = {
          battleResults: [{ won: false }],
          battleWins: loser.battle_wins,
          battleLosses: loser.battle_losses + 1
        };

        const newWinnerTraits = EvolutionService.calculateNewTraits(winner.traits, winnerPerformance);
        const newLoserTraits = EvolutionService.calculateNewTraits(loser.traits, loserPerformance);

        await winner.update({ traits: newWinnerTraits });
        await loser.update({ traits: newLoserTraits });

        // Update ratings
        const winnerNewRating = EvolutionService.calculateBattleRating(winner, loser, { won: true });
        const loserNewRating = EvolutionService.calculateBattleRating(loser, winner, { won: false });

        await winner.update({ rating: winnerNewRating });
        await loser.update({ rating: loserNewRating });
      }
    }

    logger.info('Battle Finalized', {
      battleId: battle.id,
      winner: winner_id,
      votes
    });

  } catch (error) {
    logger.error('Finalize Battle Error:', error);
  }
}

module.exports = router;
