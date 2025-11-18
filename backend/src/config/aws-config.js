const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
const { S3Client } = require('@aws-sdk/client-s3');
const { TranscribeClient } = require('@aws-sdk/client-transcribe');
require('dotenv').config();

// AWS Bedrock Configuration
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// S3 Configuration for NFT metadata backup
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Transcribe Configuration for voice processing
const transcribeClient = new TranscribeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

module.exports = {
  bedrockClient,
  s3Client,
  transcribeClient
};
