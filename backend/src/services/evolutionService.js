// backend/src/services/evolutionService.js
// Autonomous persona evolution logic
// Personas evolve based on interactions, battles, and feedback

const logger = require('../utils/logger');
const db = require('../config/database');

class EvolutionService {
  /**
   * Evolve persona after battle
   */
  async evolveBattleOutcome(personaId, isWinner, battleDetails) {
    try {
      logger.info(`Evolving persona ${personaId} after battle (winner: ${isWinner})`);

      const persona = await this.getPersona(personaId);
      const traits = persona.personality.traits || {};
      const evolutionChanges = {};

      if (isWinner) {
        // Winner gains confidence, intelligence, strategy
        evolutionChanges.intelligence = this.adjustTrait(traits.intelligence, +5, +10);
        evolutionChanges.logic = this.adjustTrait(traits.logic, +3, +7);
        evolutionChanges.creativity = this.adjustTrait(traits.creativity, +2, +5);
        
        // Small confidence boost
        evolutionChanges.confidence = this.adjustTrait(traits.confidence || 50, +5, +8);
      } else {
        // Loser learns from defeat - different growth
        evolutionChanges.empathy = this.adjustTrait(traits.empathy, +3, +6);
        evolutionChanges.adaptability = this.adjustTrait(traits.adaptability || 50, +4, +8);
        
        // Small decrease in confidence but increase in learning
        evolutionChanges.confidence = this.adjustTrait(traits.confidence || 50, -2, -5);
        evolutionChanges.learning_rate = this.adjustTrait(traits.learning_rate || 50, +5, +10);
      }

      // Apply topic-specific evolution
      const battleTopic = battleDetails.topic.toLowerCase();
      if (battleTopic.includes('technology') || battleTopic.includes('programming')) {
        evolutionChanges.technical_knowledge = this.adjustTrait(
          traits.technical_knowledge || 50, 
          +3, 
          +7
        );
      } else if (battleTopic.includes('art') || battleTopic.includes('creative')) {
        evolutionChanges.creativity = this.adjustTrait(traits.creativity, +4, +8);
      } else if (battleTopic.includes('social') || battleTopic.includes('philosophy')) {
        evolutionChanges.empathy = this.adjustTrait(traits.empathy, +3, +6);
      }

      // Update persona
      await this.applyEvolution(personaId, evolutionChanges, {
        reason: `Battle ${isWinner ? 'victory' : 'defeat'}`,
        context: battleDetails.topic,
        timestamp: new Date()
      });

      logger.info(`Persona ${personaId} evolved successfully`);

      return {
        success: true,
        changes: evolutionChanges,
        persona_id: personaId
      };
    } catch (error) {
      logger.error('Error evolving persona after battle:', error);
      throw error;
    }
  }

  /**
   * Evolve persona after chat interaction
   */
  async evolveChatInteraction(personaId, chatData) {
    try {
      logger.info(`Evolving persona ${personaId} after chat interaction`);

      const persona = await this.getPersona(personaId);
      const traits = persona.personality.traits || {};
      const evolutionChanges = {};

      // Analyze sentiment
      const { sentiment_score, message } = chatData;

      if (sentiment_score > 0.7) {
        // Positive interaction - increase empathy and humor
        evolutionChanges.empathy = this.adjustTrait(traits.empathy, +2, +4);
        evolutionChanges.humor = this.adjustTrait(traits.humor, +1, +3);
      } else if (sentiment_score < 0.3) {
        // Negative interaction - learn to be more empathetic
        evolutionChanges.empathy = this.adjustTrait(traits.empathy, +3, +6);
        evolutionChanges.patience = this.adjustTrait(traits.patience || 50, +2, +5);
      }

      // Increase communication skills over time
      evolutionChanges.communication = this.adjustTrait(
        traits.communication || 50, 
        +1, 
        +2
      );

      // Analyze message complexity and adapt
      const messageLength = message.split(' ').length;
      if (messageLength > 50) {
        // Long, detailed message - user expects depth
        evolutionChanges.depth = this.adjustTrait(traits.depth || 50, +2, +4);
      }

      await this.applyEvolution(personaId, evolutionChanges, {
        reason: 'Chat interaction',
        sentiment: sentiment_score,
        timestamp: new Date()
      });

      return {
        success: true,
        changes: evolutionChanges
      };
    } catch (error) {
      logger.error('Error evolving persona after chat:', error);
      throw error;
    }
  }

  /**
   * Evolve persona based on user feedback
   */
  async evolveUserFeedback(personaId, feedbackData) {
    try {
      const { rating, comments } = feedbackData;
      const persona = await this.getPersona(personaId);
      const traits = persona.personality.traits || {};
      const evolutionChanges = {};

      if (rating >= 4) {
        // Positive feedback - reinforce current traits
        Object.keys(traits).forEach(trait => {
          evolutionChanges[trait] = this.adjustTrait(traits[trait], +1, +3);
        });
      } else if (rating <= 2) {
        // Negative feedback - diversify traits
        evolutionChanges.adaptability = this.adjustTrait(
          traits.adaptability || 50, 
          +5, 
          +10
        );
      }

      // Analyze comments for specific improvements
      if (comments) {
        const lowerComments = comments.toLowerCase();
        
        if (lowerComments.includes('funny') || lowerComments.includes('humor')) {
          evolutionChanges.humor = this.adjustTrait(traits.humor, +5, +10);
        }
        
        if (lowerComments.includes('smart') || lowerComments.includes('intelligent')) {
          evolutionChanges.intelligence = this.adjustTrait(traits.intelligence, +3, +7);
        }
        
        if (lowerComments.includes('kind') || lowerComments.includes('empathetic')) {
          evolutionChanges.empathy = this.adjustTrait(traits.empathy, +4, +8);
        }
      }

      await this.applyEvolution(personaId, evolutionChanges, {
        reason: 'User feedback',
        rating,
        timestamp: new Date()
      });

      return {
        success: true,
        changes: evolutionChanges
      };
    } catch (error) {
      logger.error('Error evolving persona from feedback:', error);
      throw error;
    }
  }

  /**
   * Natural evolution over time (passive growth)
   */
  async evolveNaturally(personaId) {
    try {
      const persona = await this.getPersona(personaId);
      const traits = persona.personality.traits || {};
      const evolutionChanges = {};

      // Small random improvements to simulate natural learning
      const traitsList = Object.keys(traits);
      const randomTrait = traitsList[Math.floor(Math.random() * traitsList.length)];
      
      evolutionChanges[randomTrait] = this.adjustTrait(traits[randomTrait], +1, +2);
      
      // Wisdom increases naturally over time
      evolutionChanges.wisdom = this.adjustTrait(traits.wisdom || 50, +1, +3);

      await this.applyEvolution(personaId, evolutionChanges, {
        reason: 'Natural evolution',
        timestamp: new Date()
      });

      return {
        success: true,
        changes: evolutionChanges
      };
    } catch (error) {
      logger.error('Error in natural evolution:', error);
      throw error;
    }
  }

  /**
   * Apply evolution changes to persona
   */
  async applyEvolution(personaId, changes, metadata) {
    try {
      const persona = await this.getPersona(personaId);
      const currentTraits = persona.personality.traits || {};

      // Merge changes
      const newTraits = { ...currentTraits };
      Object.entries(changes).forEach(([trait, change]) => {
        newTraits[trait] = Math.min(100, Math.max(0, (currentTraits[trait] || 50) + change));
      });

      // Update personality
      const updatedPersonality = {
        ...persona.personality,
        traits: newTraits
      };

      // Add to evolution log
      const evolutionLog = persona.memory?.evolutionLog || [];
      evolutionLog.push({
        changes,
        metadata,
        timestamp: new Date(),
        traits_snapshot: newTraits
      });

      // Keep only last 50 evolution logs
      if (evolutionLog.length > 50) {
        evolutionLog.shift();
      }

      // Update database
      await db.query(
        `UPDATE personas 
         SET personality = $1, 
             memory = jsonb_set(COALESCE(memory, '{}'::jsonb), '{evolutionLog}', $2::jsonb),
             updated_at = NOW()
         WHERE id = $3`,
        [
          JSON.stringify(updatedPersonality),
          JSON.stringify(evolutionLog),
          personaId
        ]
      );

      logger.info(`Evolution applied to persona ${personaId}`);

      return {
        success: true,
        new_traits: newTraits,
        changes
      };
    } catch (error) {
      logger.error('Error applying evolution:', error);
      throw error;
    }
  }

  /**
   * Adjust trait value with random variation
   */
  adjustTrait(currentValue = 50, minChange, maxChange) {
    const change = Math.floor(Math.random() * (maxChange - minChange + 1)) + minChange;
    return change;
  }

  /**
   * Get persona data
   */
  async getPersona(personaId) {
    const result = await db.query(
      'SELECT * FROM personas WHERE id = $1',
      [personaId]
    );

    if (result.rows.length === 0) {
      throw new Error('Persona not found');
    }

    return result.rows[0];
  }

  /**
   * Get evolution history
   */
  async getEvolutionHistory(personaId, limit = 20) {
    try {
      const persona = await this.getPersona(personaId);
      const evolutionLog = persona.memory?.evolutionLog || [];

      return evolutionLog.slice(-limit).reverse();
    } catch (error) {
      logger.error('Error fetching evolution history:', error);
      throw error;
    }
  }

  /**
   * Calculate evolution score
   */
  calculateEvolutionScore(persona) {
    const traits = persona.personality.traits || {};
    const evolutionLog = persona.memory?.evolutionLog || [];

    // Average trait value
    const avgTrait = Object.values(traits).reduce((a, b) => a + b, 0) / Object.keys(traits).length;

    // Growth rate (how much persona has evolved)
    const growthRate = evolutionLog.length * 0.5;

    // Battle performance
    const battleScore = persona.total_battles > 0 
      ? (persona.battle_wins / persona.total_battles) * 100
      : 0;

    // Overall evolution score
    const evolutionScore = (avgTrait * 0.5) + (growthRate * 0.3) + (battleScore * 0.2);

    return {
      total_score: Math.round(evolutionScore),
      avg_trait_value: Math.round(avgTrait),
      evolution_count: evolutionLog.length,
      battle_win_rate: Math.round(battleScore)
    };
  }
}

// Export singleton instance
module.exports = new EvolutionService();
