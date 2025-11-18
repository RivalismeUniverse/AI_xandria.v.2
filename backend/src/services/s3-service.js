const { s3Client } = require('../config/aws-config');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../utils/logger');

class S3Service {
  constructor() {
    this.client = s3Client;
    this.bucketName = `ai-xandria-${process.env.NODE_ENV || 'development'}`;
  }

  async uploadPersonaMetadata(personaId, metadata) {
    try {
      const key = `personas/${personaId}/metadata.json`;
      const body = JSON.stringify(metadata, null, 2);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: 'application/json',
        Metadata: {
          'persona-id': personaId,
          'created-at': new Date().toISOString()
        }
      });

      await this.client.send(command);
      
      const s3Url = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      
      logger.info('S3 Upload Successful', { personaId, key });
      
      return {
        s3Url,
        key,
        bucket: this.bucketName
      };
    } catch (error) {
      logger.error('S3 Upload Error:', error);
      throw new Error(`Failed to upload to S3: ${error.message}`);
    }
  }

  async uploadBattleData(battleId, battleData) {
    try {
      const key = `battles/${battleId}/data.json`;
      const body = JSON.stringify(battleData, null, 2);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: 'application/json'
      });

      await this.client.send(command);
      
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      logger.error('Battle Data Upload Error:', error);
      throw new Error(`Failed to upload battle data: ${error.message}`);
    }
  }

  async uploadVoiceRecording(userId, audioBuffer, contentType = 'audio/wav') {
    try {
      const timestamp = Date.now();
      const key = `voice/${userId}/${timestamp}.wav`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: audioBuffer,
        ContentType: contentType,
        Metadata: {
          'user-id': userId,
          'timestamp': timestamp.toString()
        }
      });

      await this.client.send(command);
      
      return {
        s3Key: key,
        url: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
        timestamp
      };
    } catch (error) {
      logger.error('Voice Upload Error:', error);
      throw new Error(`Failed to upload voice recording: ${error.message}`);
    }
  }

  async getPersonaMetadata(personaId) {
    try {
      const key = `personas/${personaId}/metadata.json`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.client.send(command);
      const body = await response.Body.transformToString();
      
      return JSON.parse(body);
    } catch (error) {
      logger.error('S3 Get Error:', error);
      throw new Error(`Failed to retrieve metadata: ${error.message}`);
    }
  }

  async deletePersonaData(personaId) {
    try {
      const key = `personas/${personaId}/metadata.json`;
      
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.client.send(command);
      
      logger.info('S3 Data Deleted', { personaId, key });
      return true;
    } catch (error) {
      logger.error('S3 Delete Error:', error);
      throw new Error(`Failed to delete persona data: ${error.message}`);
    }
  }

  async generatePresignedUrl(key, expiresIn = 3600) {
    // For secure temporary access to private files
    // Implementation for presigned URLs
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
}

module.exports = new S3Service();
