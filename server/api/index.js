let handler;

try {
  const serverlessExpress = require('@vendia/serverless-express');
  const app = require('../src/index');

  // Create the serverless handler
  handler = serverlessExpress({ app });
} catch (error) {
  console.error('Error initializing Express app:', error);
  // Fallback handler that returns the error
  handler = (req, res) => {
    res.status(500).json({
      error: 'Failed to initialize Express app',
      message: error.message,
      stack: error.stack
    });
  };
}

module.exports = handler;
