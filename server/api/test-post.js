const cors = require('cors');

const corsOptions = {
  origin: [
    'https://wallapahbd.vercel.app',
    'http://localhost:5173',
    'http://localhost:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

module.exports = async (req, res) => {
  try {
    await runMiddleware(req, res, cors(corsOptions));

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'POST') {
      console.log('Test POST - headers:', req.headers);
      console.log('Test POST - body:', req.body);

      return res.status(200).json({
        success: true,
        message: 'Test POST successful',
        receivedBody: req.body,
        headers: req.headers
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Test POST error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};
