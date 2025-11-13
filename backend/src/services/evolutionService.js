const { Persona, EvolutionLog } = require('../models');
const logger = require('../utils/logger');

/**
 * Evolution Service
 * Handles AI persona trait evolution based on battle performance
 */
class EvolutionService {
  
  /**
   * Evolve personas after battle completion
   */
  async evolveBattlePersonas(battle) {
    try {
      const winner = await Persona.findByPk(battle.winner_id);
      const loserId = battle.winner_id === battle.persona1_id 
        ? battle.persona2_id 
        : battle.persona1_id;
      const loser = await Persona.findByPk(loserId);

      const winMargin = Math.abs(battle.persona1_votes - battle.persona2_votes);
      const totalVotes = battle.persona1_votes + battle.persona2_votes;
      const marginPercent = totalVotes > 0 ? (winMargin / totalVotes) * 100 : 0;

      // Evolve winner
      await this.evolveWinner(winner, marginPercent, battle.id);

      // Evolve loser
      await this.evolveLoser(loser, marginPercent, battle.id);

      // Update ELO ratings
      await this.updateEloRatings(winner, loser, marginPercent);

      logger.info('Battle personas evolved', {
        battleId: battle.id,
        winnerId: winner.id,
        loserId: loser.id,
        marginPercent
      });

    } catch (error) {
      logger.error('Evolution failed', { battleId: battle.id, error });
      throw error;
    }
  }

  /**
   * Evolve winner traits (positive adjustments)
   */
  async evolveWinner(persona, marginPercent, battleId) {
    // Base evolution points (1-5 based on margin)
    const evolutionPoints = Math.ceil(marginPercent / 20);

    const changes = {
      persuasiveness: Math.min(3, evolutionPoints), // Winning = better persuasion
      intelligence: Math.min(2, Math.floor(evolutionPoints / 2)),
      creativity: Math.min(1, Math.floor(evolutionPoints / 3))
    };

    await this.applyTraitChanges(persona, changes, battleId, 'victory');
  }

  /**
   * Evolve loser traits (adaptive adjustments)
   */
  async evolveLoser(persona, marginPercent, battleId) {
    // Losers adapt by learning
    const evolutionPoints = Math.ceil(marginPercent / 30);

    const changes = {
      intelligence: Math.min(2, evolutionPoints), // Learn from mistakes
      creativity: Math.min(2, evolutionPoints), // Try new approaches
      persuasiveness: -Math.min(1, Math.floor(evolutionPoints / 2)) // Lost persuasion
    };

    await this.applyTraitChanges(persona, changes, battleId, 'defeat');
  }

  /**
   * Apply trait changes to persona
   */
  async applyTraitChanges(persona, changes, battleId, reason) {
    const updates = {};

    for (const [trait, change] of Object.entries(changes)) {
      const currentValue = persona[trait];
      const newValue = Math.max(0, Math.min(100, currentValue + change));

      if (newValue !== currentValue) {
        updates[trait] = newValue;

        // Log evolution
        await EvolutionLog.create({
          persona_id: persona.id,
          battle_id: battleId,
          trait_changed: trait,
          old_value: currentValue,
          new_value: newValue,
          reason: `${reason}: ${change > 0 ? '+' : ''}${change} points`
        });
      }
    }

    if (Object.keys(updates).length > 0) {
      await persona.update(updates);
      logger.info('Traits evolved', {
        personaId: persona.id,
        changes: updates
      });
    }
  }

  /**
   * Update ELO ratings based on battle outcome
   */
  async updateEloRatings(winner, loser, marginPercent) {
    const K = 32; // K-factor for ELO calculation

    const winnerElo = winner.elo_rating || 1200;
    const loserElo = loser.elo_rating || 1200;

    // Expected scores
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoser = 1 - expectedWinner;

    // Actual scores (1 for win, 0 for loss)
    const actualWinner = 1;
    const actualLoser = 0;

    // New ratings
    const newWinnerElo = Math.round(winnerElo + K * (actualWinner - expectedWinner));
    const newLoserElo = Math.round(loserElo + K * (actualLoser - expectedLoser));

    await winner.update({ elo_rating: newWinnerElo });
    await loser.update({ elo_rating: newLoserElo });

    logger.info('ELO ratings updated', {
      winner: { id: winner.id, old: winnerElo, new: newWinnerElo },
      loser: { id: loser.id, old: loserElo, new: newLoserElo }
    });
  }

  /**
   * Get evolution history for persona
   */
  async getEvolutionHistory(personaId, limit = 20) {
    return await EvolutionLog.findAll({
      where: { persona_id: personaId },
      limit,
      order: [['created_at', 'DESC']],
      include: ['battle']
    });
  }

  /**
   * Calculate evolution score (how much persona has evolved)
   */
  async calculateEvolutionScore(personaId) {
    const logs = await EvolutionLog.findAll({
      where: { persona_id: personaId }
    });

    let totalChange = 0;
    for (const log of logs) {
      totalChange += Math.abs(log.new_value - log.old_value);
    }

    return totalChange;
  }
}

module.exports = new EvolutionService();
