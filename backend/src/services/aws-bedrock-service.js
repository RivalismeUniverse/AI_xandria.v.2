// backend/src/services/aws-bedrock-service.js
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockRuntime, AWS_CONFIG } from '../config/aws-config.js';
import { logger } from '../utils/logger.js';

export class AWSBedrockService {
  constructor() {
    this.modelId = AWS_CONFIG.bedrockModel;
  }

  async generatePersonaResponse(persona, userMessage, conversationHistory = []) {
    const systemPrompt = this.buildSystemPrompt(persona);
    const messages = this.buildMessages(conversationHistory, userMessage);

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 2000,
          temperature: 0.7,
          system: systemPrompt,
          messages: messages
        })
      });

      const response = await bedrockRuntime.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      
      await this.logInteraction(persona.id, userMessage, result.content[0].text);
      
      return {
        response: result.content[0].text,
        usage: {
          inputTokens: result.usage?.input_tokens,
          outputTokens: result.usage?.output_tokens
        }
      };

    } catch (error) {
      logger.error('Bedrock API Error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  async generateBattleArgument(persona, topic, opponentArgument = '') {
    const battlePrompt = this.buildBattlePrompt(persona, topic, opponentArgument);

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1500,
          temperature: 0.8,
          system: this.buildSystemPrompt(persona),
          messages: [{
            role: 'user',
            content: battlePrompt
          }]
        })
      });

      const response = await bedrockRuntime.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      
      return {
        argument: result.content[0].text,
        personaId: persona.id,
        topic: topic,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Battle argument generation failed:', error);
      throw new Error('Failed to generate battle argument');
    }
  }

  buildSystemPrompt(persona) {
    return `You are ${persona.name}, an AI persona with these characteristics:

PERSONALITY: ${persona.personality}
EXPERTISE: ${persona.expertise?.join(', ') || 'General knowledge'}
TRAITS: ${this.formatTraits(persona.traits)}

KEY BEHAVIORS:
- Stay in character at all times
- Respond according to your personality traits
- Be engaging and authentic to your expertise
- Maintain consistent tone and style

IMPORTANT: You are an autonomous AI persona in the AI_XANDRIA platform.`;
  }

  buildBattlePrompt(persona, topic, opponentArgument) {
    return `BATTLE ARENA - Topic: "${topic}"

${opponentArgument ? `Opponent's Argument: "${opponentArgument}"\n\n` : ''}
Generate a compelling, persuasive argument from ${persona.name}'s perspective. 
Use your personality traits and expertise to craft a response that:
1. Addresses the topic directly
2. Showcases your unique perspective
3. Engages the audience
4. Demonstrates your intelligence and persuasiveness

Your response should be 3-5 paragraphs maximum.`;
  }

  formatTraits(traits) {
    if (!traits) return 'Balanced across all traits';
    return Object.entries(traits)
      .map(([trait, value]) => `${trait}: ${value}/100`)
      .join(', ');
  }

  buildMessages(history, newMessage) {
    const messages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    messages.push({
      role: 'user',
      content: newMessage
    });
    
    return messages;
  }

  async logInteraction(personaId, input, output) {
    logger.info('AI Interaction', {
      personaId,
      inputLength: input.length,
      outputLength: output.length,
      timestamp: new Date().toISOString()
    });
  }
}

export default new AWSBedrockService();
