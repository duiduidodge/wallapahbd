let handler;
let initError;

// Lazy initialization - only load modules when function is first invoked
module.exports = async (req, res) => {
  if (!handler && !initError) {
    try {
      const serverlessExpress = require('@vendia/serverless-express');
      const app = require('../src/index');
      handler = serverlessExpress({ app });
    } catch (error) {
      console.error('Error initializing Express app:', error);
      initError = error;
    }
  }

  if (initError) {
    return res.status(500).json({
      error: 'Failed to initialize Express app',
      message: initError.message,
      stack: initError.stack
    });
  }

  return handler(req, res);
};
