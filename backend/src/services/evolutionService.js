const logger = require('../utils/logger');

class EvolutionService {
  constructor() {
    this.evolutionWeights = {
      battle_win: 1.5,
      battle_loss: -0.8,
      user_rating: 0.1,
      chat_engagement: 0.05,
      rental_usage: 0.2
    };
  }

  calculateNewTraits(currentTraits, performanceData) {
    try {
      const newTraits = { ...currentTraits };
      let totalEvolution = 0;

      // Battle performance impact
      if (performanceData.battleResults) {
        performanceData.battleResults.forEach(result => {
          const impact = result.won ? 
            this.evolutionWeights.battle_win : 
            this.evolutionWeights.battle_loss;
          
          this.applyTraitEvolution(newTraits, 'intelligence', impact * 0.7);
          this.applyTraitEvolution(newTraits, 'persuasiveness', impact * 1.2);
          this.applyTraitEvolution(newTraits, 'creativity', impact * 0.9);
          
          totalEvolution += Math.abs(impact);
        });
      }

      // User rating impact
      if (performanceData.averageRating) {
        const ratingImpact = (performanceData.averageRating - 3) * this.evolutionWeights.user_rating;
        this.applyTraitEvolution(newTraits, 'knowledge', ratingImpact * 0.8);
        this.applyTraitEvolution(newTraits, 'humor', ratingImpact * 0.5);
      }

      // Chat engagement impact
      if (performanceData.chatSessions > 10) {
        const engagementImpact = Math.log(performanceData.chatSessions) * this.evolutionWeights.chat_engagement;
        this.applyTraitEvolution(newTraits, 'intelligence', engagementImpact);
        this.applyTraitEvolution(newTraits, 'creativity', engagementImpact * 0.6);
      }

      // Rental usage impact
      if (performanceData.rentalCount > 0) {
        const rentalImpact = performanceData.rentalCount * this.evolutionWeights.rental_usage;
        this.applyTraitEvolution(newTraits, 'persuasiveness', rentalImpact);
        this.applyTraitEvolution(newTraits, 'knowledge', rentalImpact * 0.8);
      }

      // Ensure traits stay within bounds
      this.normalizeTraits(newTraits);

      logger.info('Trait Evolution Calculated', {
        personaId: performanceData.personaId,
        oldTraits: currentTraits,
        newTraits,
        totalEvolution
      });

      return newTraits;
    } catch (error) {
      logger.error('Trait Evolution Error:', error);
      return currentTraits; // Return original traits if calculation fails
    }
  }

  applyTraitEvolution(traits, traitName, impact) {
    if (traits[traitName] !== undefined) {
      traits[traitName] = Math.max(0, Math.min(100, traits[traitName] + impact));
    }
  }

  normalizeTraits(traits) {
    Object.keys(traits).forEach(trait => {
      traits[trait] = Math.max(0, Math.min(100, Math.round(traits[trait] * 10) / 10));
    });
  }

  calculateBattleRating(persona, opponent, battleResult) {
    const kFactor = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponent.rating - persona.rating) / 400));
    
    const actualScore = battleResult.won ? 1 : 0;
    const ratingChange = kFactor * (actualScore - expectedScore);
    
    const newRating = Math.max(0, persona.rating + ratingChange);
    
    logger.info('Rating Updated', {
      personaId: persona.id,
      oldRating: persona.rating,
      newRating,
      change: ratingChange,
      opponentRating: opponent.rating
    });

    return newRating;
  }

  shouldEvolveToNFT(persona, performanceData) {
    // Criteria for automatic NFT minting
    const criteria = {
      minBattles: 5,
      minRating: 4.0,
      minWinRate: 0.6,
      minChatSessions: 20
    };

    const winRate = performanceData.battleWins / Math.max(1, performanceData.battleWins + performanceData.battleLosses);
    
    return (
      performanceData.battleWins + performanceData.battleLosses >= criteria.minBattles &&
      persona.rating >= criteria.minRating &&
      winRate >= criteria.minWinRate &&
      performanceData.chatSessions >= criteria.minChatSessions
    );
  }

  generateEvolutionReport(persona, oldTraits, newTraits, performanceData) {
    const changes = {};
    Object.keys(newTraits).forEach(trait => {
      changes[trait] = {
        old: oldTraits[trait],
        new: newTraits[trait],
        change: (newTraits[trait] - oldTraits[trait]).toFixed(2)
      };
    });

    return {
      personaId: persona.id,
      evolutionDate: new Date().toISOString(),
      performanceSummary: {
        battles: performanceData.battleWins + performanceData.battleLosses,
        winRate: (performanceData.battleWins / Math.max(1, performanceData.battleWins + performanceData.battleLosses)).toFixed(2),
        averageRating: performanceData.averageRating,
        chatSessions: performanceData.chatSessions
      },
      traitChanges: changes,
      recommendedActions: this.getRecommendedActions(newTraits, performanceData)
    };
  }

  getRecommendedActions(traits, performanceData) {
    const actions = [];
    
    if (traits.persuasiveness < 60 && performanceData.battleLosses > performanceData.battleWins) {
      actions.push('Focus on persuasive argument training');
    }
    
    if (traits.creativity < 50) {
      actions.push('Engage in creative thinking exercises');
    }
    
    if (traits.knowledge < 70) {
      actions.push('Expand knowledge base in specialized domains');
    }
    
    return actions;
  }
}

module.exports = new EvolutionService();
