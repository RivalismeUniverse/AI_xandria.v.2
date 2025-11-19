const serverless = require('serverless-http');
const app = require('./server');

// AWS Lambda handler
exports.handler = serverless(app, {
  binary: ['audio/*', 'image/*']
});
