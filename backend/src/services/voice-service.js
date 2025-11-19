const { transcribeClient } = require('../config/aws-config');
const { StartTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const s3Service = require('./s3-service');
const logger = require('../utils/logger');

class VoiceService {
  constructor() {
    this.client = transcribeClient;
  }

  async transcribeAudio(audioBuffer, languageCode = 'en-US') {
    try {
      // First upload audio to S3
      const uploadResult = await s3Service.uploadVoiceRecording(
        'transcription', 
        audioBuffer
      );

      // Start AWS Transcribe job
      const jobName = `transcription-${Date.now()}`;
      
      const command = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: languageCode,
        Media: {
          MediaFileUri: uploadResult.url
        },
        MediaFormat: 'wav',
        OutputBucketName: s3Service.bucketName,
        Settings: {
          ShowSpeakerLabels: true,
          MaxSpeakerLabels: 2
        }
      });

      await this.client.send(command);
      
      logger.info('Transcription Job Started', { jobName, audioUrl: uploadResult.url });

      // In a real implementation, you'd poll for job completion
      // For hackathon, we'll simulate the response
      return await this.simulateTranscriptionResult(audioBuffer);
      
    } catch (error) {
      logger.error('Transcription Error:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  async simulateTranscriptionResult(audioBuffer) {
    // Simulate transcription for hackathon demo
    // In production, you'd use the actual Transcribe result
    
    const sampleResponses = [
      "I believe that artificial intelligence will revolutionize education by providing personalized learning experiences for every student.",
      "The future of creativity lies in the collaboration between human imagination and AI's computational power.",
      "We should focus on developing AI systems that augment human capabilities rather than replace them entirely.",
      "The ethical implications of advanced AI require careful consideration and proactive regulation."
    ];
    
    const randomResponse = sampleResponses[
      Math.floor(Math.random() * sampleResponses.length)
    ];

    return {
      jobStatus: 'COMPLETED',
      transcript: randomResponse,
      confidence: 0.85 + (Math.random() * 0.1),
      words: randomResponse.split(' ').map(word => ({
        word: word,
        confidence: 0.8 + (Math.random() * 0.15),
        startTime: 0,
        endTime: 0
      }))
    };
  }

  async processVoiceCommand(audioBuffer, persona) {
    try {
      const transcription = await this.transcribeAudio(audioBuffer);
      
      if (transcription.confidence < 0.7) {
        throw new Error('Low transcription confidence');
      }

      // Analyze command type
      const commandType = this.analyzeCommandType(transcription.transcript);
      
      return {
        text: transcription.transcript,
        commandType: commandType,
        confidence: transcription.confidence,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Voice Command Processing Error:', error);
      throw new Error(`Failed to process voice command: ${error.message}`);
    }
  }

  analyzeCommandType(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes('battle') || lowerTranscript.includes('debate')) {
      return 'battle';
    } else if (lowerTranscript.includes('create') || lowerTranscript.includes('make')) {
      return 'creation';
    } else if (lowerTranscript.includes('rent') || lowerTranscript.includes('buy')) {
      return 'marketplace';
    } else if (lowerTranscript.includes('help') || lowerTranscript.includes('what can you do')) {
      return 'help';
    } else {
      return 'chat';
    }
  }

  async generateVoiceResponse(text, voiceSettings = {}) {
    // Integration with Amazon Polly for text-to-speech
    // For hackathon, we'll return mock data
    
    return {
      audioUrl: `https://${s3Service.bucketName}.s3.amazonaws.com/voice-responses/${Date.now()}.mp3`,
      duration: text.length / 10, // Rough estimate
      text: text,
      voiceId: voiceSettings.voiceId || 'Joanna'
    };
  }
}

module.exports = new VoiceService();
