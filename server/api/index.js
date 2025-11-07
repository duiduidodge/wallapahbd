const serverlessExpress = require('@vendia/serverless-express');
const app = require('../src/index');

// Create the serverless handler
const handler = serverlessExpress({ app });

module.exports = handler;
