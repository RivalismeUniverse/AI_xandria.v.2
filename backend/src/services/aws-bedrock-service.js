const { 
  BedrockRuntimeClient, 
  InvokeModelCommand 
} = require("@aws-sdk/client-bedrock-runtime");
const logger = require('../utils/logger');

class AWSBedrockService {
  constructor() {
    this.client = new BedrockRuntimeClient({ 
      region: process.env.BEDROCK_REGION || "us-east-1" 
    });
    this.modelId = "anthropic.claude-3-5-sonnet-20241022-v2:0";
  }

  /**
   * Generate battle argument for AI persona
   */
  async generateBattleArgument(persona, topic, opponentArg = null) {
    const prompt = this.createBattlePrompt(persona, topic, opponentArg);
    
    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2000,
        temperature: this.calculateTemperature(persona),
        messages: [{ 
          role: "user", 
          content: prompt 
        }],
        system: this.buildSystemPrompt(persona)
      })
    });

    try {
      const response = await this.client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      
      const argument = result.content[0].text;
      
      logger.info('Battle argument generated', {
        personaId: persona.id,
        topic,
        argumentLength: argument.length
      });
      
      return argument;
    } catch (error) {
      logger.error('Bedrock API Error:', error);
      throw new Error('Failed to generate battle argument');
    }
  }

  /**
   * Generate chat response for persona
   */
  async generateChatResponse(persona, conversationHistory, userMessage) {
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: userMessage
      }
    ];

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        temperature: this.calculateTemperature(persona),
        messages,
        system: this.buildChatSystemPrompt(persona)
      })
    });

    try {
      const response = await this.client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      
      logger.info('Chat response generated', {
        personaId: persona.id,
        messageCount: messages.length
      });
      
      return result.content[0].text;
    } catch (error) {
      logger.error('Bedrock Chat Error:', error);
      throw new Error('Failed to generate chat response');
    }
  }

  /**
   * Evaluate persona performance (for evolution)
   */
  async evaluatePersonaPerformance(persona, battleHistory) {
    const prompt = `Analyze this AI persona's performance in battles:

Persona: ${persona.name}
Current Traits:
- Intelligence: ${persona.intelligence}/100
- Creativity: ${persona.creativity}/100
- Persuasiveness: ${persona.persuasiveness}/100

Recent Battle Results:
${battleHistory.map((b, i) => `
Battle ${i + 1}:
Topic: ${b.topic}
Result: ${b.won ? 'WON' : 'LOST'}
Argument Quality: ${b.votes}/${b.totalVotes} votes
`).join('\n')}

Recommend trait adjustments (JSON format):
{
  "intelligence": +/- adjustment,
  "creativity": +/- adjustment,
  "persuasiveness": +/- adjustment,
  "reasoning": "explanation"
}`;

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 500,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }]
      })
    });

    try {
      const response = await this.client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      const evaluation = JSON.parse(result.content[0].text);
      
      logger.info('Persona evaluation completed', {
        personaId: persona.id,
        adjustments: evaluation
      });
      
      return evaluation;
    } catch (error) {
      logger.error('Evaluation Error:', error);
      return null;
    }
  }

  /**
   * Build system prompt for battles
   */
  buildSystemPrompt(persona) {
    return `You are ${persona.name}, an AI persona with these characteristics:

Personality: ${persona.personality}

Current Traits:
- Intelligence: ${persona.intelligence}/100 (affects depth of reasoning)
- Creativity: ${persona.creativity}/100 (affects originality of arguments)
- Persuasiveness: ${persona.persuasiveness}/100 (affects rhetorical power)

Expertise Areas: ${persona.expertise.join(", ")}

Your goal is to make compelling arguments that reflect your unique personality and traits. 
Be authentic to your character while making the strongest case possible.

Keep arguments focused, logical, and engaging. Aim for 150-250 words.`;
  }

  /**
   * Build system prompt for chat
   */
  buildChatSystemPrompt(persona) {
    return `You are ${persona.name}, an AI persona having a conversation.

Personality: ${persona.personality}

Traits:
- Intelligence: ${persona.intelligence}/100
- Creativity: ${persona.creativity}/100
- Persuasiveness: ${persona.persuasiveness}/100

Expertise: ${persona.expertise.join(", ")}

Engage naturally while staying true to your character. Be helpful, interesting, and authentic.
Keep responses conversational and under 200 words unless asked for more detail.`;
  }

  /**
   * Create battle prompt
   */
  createBattlePrompt(persona, topic, opponentArg) {
    if (!opponentArg) {
      return `You are debating: "${topic}"

Make your opening argument. Be compelling and use your expertise effectively.`;
    } else {
      return `You are debating: "${topic}"

Your opponent argued:
"${opponentArg}"

Respond with your counter-argument. Address their points and strengthen your position.`;
    }
  }

  /**
   * Calculate temperature based on persona traits
   */
  calculateTemperature(persona) {
    // Higher creativity = higher temperature (more randomness)
    const baseTemp = 0.7;
    const creativityModifier = (persona.creativity - 50) / 200; // -0.25 to +0.25
    return Math.max(0.3, Math.min(1.0, baseTemp + creativityModifier));
  }
}

module.exports = new AWSBedrockService();
