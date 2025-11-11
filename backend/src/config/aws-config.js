// backend/src/config/aws-config.js
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { S3Client } from '@aws-sdk/client-s3';
import { RDSDataClient } from '@aws-sdk/client-rds-data';

export const bedrockRuntime = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  maxAttempts: 3
});

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

export const rdsDataClient = new RDSDataClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

export const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  bedrockModel: process.env.BEDROCK_MODEL || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  bedrockImageModel: process.env.BEDROCK_IMAGE_MODEL || 'amazon.titan-image-generator-v1',
  s3Buckets: {
    personas: process.env.S3_PERSONAS_BUCKET || 'ai-xandria-dev-personas',
    nfts: process.env.S3_NFTS_BUCKET || 'ai-xandria-dev-nfts',
    battles: process.env.S3_BATTLES_BUCKET || 'ai-xandria-dev-battles'
  }
};
