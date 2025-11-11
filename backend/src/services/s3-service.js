// backend/src/services/s3-service.js
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, AWS_CONFIG } from '../config/aws-config.js';
import { logger } from '../utils/logger.js';

export class S3Service {
  constructor() {
    this.buckets = AWS_CONFIG.s3Buckets;
  }

  async uploadPersonaAvatar(imageBuffer, personaName, contentType = 'image/png') {
    const key = `personas/${personaName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
    
    const command = new PutObjectCommand({
      Bucket: this.buckets.personas,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
      ACL: 'public-read',
      Metadata: {
        'uploaded-by': 'ai-xandria-backend',
        'persona-name': personaName
      }
    });

    try {
      await s3Client.send(command);
      const url = `https://${this.buckets.personas}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`;
      
      logger.info('Avatar uploaded to S3', { personaName, url });
      return url;

    } catch (error) {
      logger.error('S3 upload failed:', error);
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }
  }

  async uploadNFTMetadata(metadata, tokenId) {
    const key = `nfts/${tokenId}/metadata.json`;
    const metadataString = JSON.stringify(metadata, null, 2);

    const command = new PutObjectCommand({
      Bucket: this.buckets.nfts,
      Key: key,
      Body: metadataString,
      ContentType: 'application/json',
      ACL: 'public-read'
    });

    try {
      await s3Client.send(command);
      const url = `https://${this.buckets.nfts}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`;
      
      return url;

    } catch (error) {
      logger.error('NFT metadata upload failed:', error);
      throw new Error('Failed to upload NFT metadata');
    }
  }

  async uploadBattleData(battleId, battleData) {
    const key = `battles/${battleId}/data.json`;
    
    const command = new PutObjectCommand({
      Bucket: this.buckets.battles,
      Key: key,
      Body: JSON.stringify(battleData),
      ContentType: 'application/json',
      ACL: 'public-read'
    });

    try {
      await s3Client.send(command);
      return `https://${this.buckets.battles}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`;

    } catch (error) {
      logger.error('Battle data upload failed:', error);
      throw new Error('Failed to upload battle data');
    }
  }

  async deleteObject(bucket, key) {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });

    try {
      await s3Client.send(command);
      logger.info('S3 object deleted', { bucket, key });
    } catch (error) {
      logger.error('S3 delete failed:', error);
      throw new Error('Failed to delete S3 object');
    }
  }
}

export default new S3Service();
