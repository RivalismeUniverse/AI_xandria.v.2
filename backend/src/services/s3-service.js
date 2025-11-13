const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../utils/logger');

class S3Service {
  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.bucket = process.env.S3_BUCKET || 'ai-xandria-metadata';
  }

  /**
   * Upload persona metadata to S3
   */
  async uploadMetadata(personaId, metadata) {
    try {
      const key = `personas/${personaId}/metadata.json`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json',
        ACL: 'public-read'
      });

      await this.client.send(command);

      const url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      logger.info('Metadata uploaded to S3', {
        personaId,
        url
      });

      return url;
    } catch (error) {
      logger.error('S3 upload failed:', error);
      throw new Error('Failed to upload metadata to S3');
    }
  }

  /**
   * Upload avatar image to S3
   */
  async uploadAvatar(personaId, imageBuffer, contentType) {
    try {
      const extension = contentType.split('/')[1];
      const key = `personas/${personaId}/avatar.${extension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
        ACL: 'public-read'
      });

      await this.client.send(command);

      const url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      logger.info('Avatar uploaded to S3', {
        personaId,
        url
      });

      return url;
    } catch (error) {
      logger.error('S3 avatar upload failed:', error);
      throw new Error('Failed to upload avatar to S3');
    }
  }

  /**
   * Get metadata from S3
   */
  async getMetadata(personaId) {
    try {
      const key = `personas/${personaId}/metadata.json`;

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const response = await this.client.send(command);
      const body = await response.Body.transformToString();
      
      return JSON.parse(body);
    } catch (error) {
      logger.error('S3 get metadata failed:', error);
      return null;
    }
  }

  /**
   * Generate pre-signed URL for avatar upload
   */
  async getUploadUrl(personaId, contentType) {
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    
    try {
      const extension = contentType.split('/')[1];
      const key = `personas/${personaId}/avatar.${extension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType
      });

      const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });

      return {
        upload_url: url,
        public_url: `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
      };
    } catch (error) {
      logger.error('Failed to generate upload URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }
}

module.exports = new S3Service();
