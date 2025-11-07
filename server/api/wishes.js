const cors = require('cors');
const { nanoid } = require('nanoid');
const { addWish, readWishes } = require('../src/wishStore');

// CORS configuration
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

// Helper to run middleware
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

const formatWishForResponse = (wish) => ({
  ...wish,
  imageUrl: wish.imageFileName ? `/uploads/${wish.imageFileName}` : null
});

module.exports = async (req, res) => {
  // Handle CORS
  await runMiddleware(req, res, cors(corsOptions));

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const wishes = await readWishes();
      res.setHeader('Cache-Control', 'public, max-age=30');
      return res.status(200).json({ wishes: wishes.map(formatWishForResponse) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง' });
    }
  }

  if (req.method === 'POST') {
    // For now, just return an error for POST requests since file upload requires more setup
    return res.status(501).json({ error: 'POST endpoint not yet implemented in serverless' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
