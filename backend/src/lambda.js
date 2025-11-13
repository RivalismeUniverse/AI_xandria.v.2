const serverless = require('serverless-http');
const app = require('./server');

// Wrap Express app for AWS Lambda
module.exports.handler = serverless(app, {
  // Binary media types (for file uploads)
  binary: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
  
  // Request/response transformations
  request(request, event, context) {
    // Add AWS context to request
    request.context = context;
    request.event = event;
  },
  
  response(response, event, context) {
    // Add CORS headers if not already present
    if (!response.headers['Access-Control-Allow-Origin']) {
      response.headers['Access-Control-Allow-Origin'] = '*';
    }
    return response;
  }
});
