const serverless = require('serverless-http');
const app = require('./server');

// ✅ Wrap Express app for AWS Lambda
const handler = serverless(app, {
  binary: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
  request(request, event, context) {
    request.context = context;
    request.event = event;
  },
  response(response, event, context) {
    if (!response.headers['Access-Control-Allow-Origin']) {
      response.headers['Access-Control-Allow-Origin'] = '*';
    }
    return response;
  }
});

module.exports.handler = handler;
