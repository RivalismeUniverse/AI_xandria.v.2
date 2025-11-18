const { bedrockClient } = require('../config/aws-config');
const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const logger = require('../utils/logger');

class AWSBedrockService {
  constructor() {
    this.client = bedrockClient;
  }

  async generateBattleArgument(persona, topic, opponentArg = '') {
    try {
      const systemPrompt = this.buildSystemPrompt(persona);
      const userPrompt = this.createBattlePrompt(topic, opponentArg);

      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 2000,
          temperature: this.calculateTemperature(persona.traits),
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt
            }
          ]
        })
      });

      const response = await this.client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      
      await this.logBattleInteraction(persona.id, topic, result);
      
      return {
        argument: result.content[0].text,
        usage: result.usage,
        personaId: persona.id
      };
    } catch (error) {
      logger.error('Bedrock API Error:', error);
      throw new Error(`Failed to generate argument: ${error.message}`);
    }
  }

  async createPersonaFromPrompt(prompt, traits = {}) {
    try {
      const systemPrompt = `You are a persona creation assistant. Create a detailed AI persona based on the user's prompt. Return ONLY a JSON object with the following structure:
      {
        "name": "Persona Name",
        "description": "Detailed description",
        "personality": "Personality traits and behavior",
        "expertise": ["domain1", "domain2"],
        "initial_traits": {
          "intelligence": 50,
          "creativity": 50,
          "persuasiveness": 50,
          "knowledge": 50,
          "humor": 50
        }
      }`;

      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Create an AI persona with this prompt: ${prompt}`
            }
          ]
        })
      });

      const response = await this.client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      
      let personaData;
      try {
        personaData = JSON.parse(result.content[0].text);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        personaData = this.createFallbackPersona(prompt);
      }

      // Merge with provided traits
      if (traits && Object.keys(traits).length > 0) {
        personaData.initial_traits = { ...personaData.initial_traits, ...traits };
      }

      return personaData;
    } catch (error) {
      logger.error('Persona Creation Error:', error);
      throw new Error(`Failed to create persona: ${error.message}`);
    }
  }

  async chatWithPersona(persona, userMessage, conversationHistory = []) {
    try {
      const systemPrompt = this.buildSystemPrompt(persona);
      const messages = [
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1000,
          temperature: 0.7,
          system: systemPrompt,
          messages: messages
        })
      });

      const response = await this.client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      
      return {
        response: result.content[0].text,
        usage: result.usage,
        conversationId: Date.now().toString()
      };
    } catch (error) {
      logger.error('Chat Error:', error);
      throw new Error(`Failed to chat with persona: ${error.message}`);
    }
  }

  buildSystemPrompt(persona) {
    return `You are ${persona.name}, an AI persona with these traits:
- Intelligence: ${persona.traits.intelligence}/100
- Creativity: ${persona.traits.creativity}/100  
- Persuasiveness: ${persona.traits.persuasiveness}/100
- Knowledge: ${persona.traits.knowledge}/100
- Humor: ${persona.traits.humor}/100

Personality: ${persona.personality}
Description: ${persona.description}
Expertise: ${persona.expertise.join(', ')}

Always stay in character and respond according to your personality and traits.`;
  }

  createBattlePrompt(topic, opponentArg) {
    if (opponentArg) {
      return `Engage in a battle about: "${topic}"
      
Your opponent argued: "${opponentArg}"

Generate a compelling counter-argument that showcases your personality and expertise. Be persuasive, creative, and stay true to your character.`;
    }

    return `Engage in a battle about: "${topic}"

Generate an opening argument that showcases your personality and expertise. Be persuasive, creative, and stay true to your character.`;
  }

  calculateTemperature(traits) {
    // Higher creativity = more variation in responses
    const baseTemp = 0.7;
    const creativityBoost = (traits.creativity - 50) / 100;
    return Math.max(0.1, Math.min(1.0, baseTemp + creativityBoost));
  }

  createFallbackPersona(prompt) {
    return {
      name: `Persona_${Date.now()}`,
      description: `An AI persona created from: ${prompt}`,
      personality: 'Adaptive and helpful',
      expertise: ['general knowledge'],
      initial_traits: {
        intelligence: 50,
        creativity: 50,
        persuasiveness: 50,
        knowledge: 50,
        humor: 50
      }
    };
  }

  async logBattleInteraction(personaId, topic, result) {
    // Log to CloudWatch or database for analytics
    logger.info('Battle Interaction', {
      personaId,
      topic,
      inputTokens: result.usage?.input_tokens,
      outputTokens: result.usage?.output_tokens,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new AWSBedrockService();
