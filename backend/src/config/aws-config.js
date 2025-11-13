require('dotenv').config();

/**
 * AWS SDK Configuration
 */
module.exports = {
  region: process.env.AWS_REGION || 'us-east-1',
  
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },

  bedrock: {
    region: process.env.BEDROCK_REGION || 'us-east-1',
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    maxTokens: 2000,
    temperature: 0.7
  },

  s3: {
    bucket: process.env.S3_BUCKET || 'ai-xandria-metadata',
    region: process.env.AWS_REGION || 'us-east-1'
  },

  cloudWatch: {
    logGroupPrefix: '/ai-xandria',
    logStreams: {
      battles: 'battles',
      evolution: 'evolution',
      bedrock: 'bedrock-calls',
      payments: 'payments',
      errors: 'errors'
    }
  },

  rds: {
    host: process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT || '5432'),
    database: process.env.RDS_DATABASE,
    username: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD
  }
};
