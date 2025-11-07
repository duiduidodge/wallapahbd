const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { nanoid } = require('nanoid');
const { addWish, readWishes } = require('./wishStore');

const PORT = process.env.PORT || 4000;
// Use /tmp for Vercel serverless, local uploads dir for development
const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', 'uploads');
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

// Enable compression for all responses
app.use(compression());

// Configure CORS to allow frontend domain
app.use(cors({
  origin: [
    'https://wallapahbd.vercel.app',
    'http://localhost:5173',
    'http://localhost:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Cache static files for 1 day
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'
});

const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 wishes per 15 minutes
  message: 'คุณส่งคำอวยพรมากเกินไป กรุณารอสักครู่'
});

// In-memory cache for wishes
let wishesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 30000; // 30 seconds

const getCachedWishes = async () => {
  const now = Date.now();
  if (wishesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return wishesCache;
  }

  const wishes = await readWishes();
  wishesCache = wishes;
  cacheTimestamp = now;
  return wishes;
};

const invalidateCache = () => {
  wishesCache = null;
  cacheTimestamp = null;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${nanoid()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      const error = new Error('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP เท่านั้น');
      error.code = 'UNSUPPORTED_FILE_TYPE';
      return cb(error);
    }
    cb(null, true);
  }
});

const formatWishForResponse = (wish) => ({
  ...wish,
  imageUrl: wish.imageFileName ? `/uploads/${wish.imageFileName}` : null
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/wishes', apiLimiter, async (_req, res, next) => {
  try {
    const wishes = await getCachedWishes();

    // Set cache headers
    res.set('Cache-Control', 'public, max-age=30');
    res.json({ wishes: wishes.map(formatWishForResponse) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/wishes', postLimiter, upload.single('image'), async (req, res, next) => {
  try {
    const { name = '', message = '' } = req.body ?? {};
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || trimmedName.length > 60) {
      return res.status(400).json({ error: 'กรุณาใส่ชื่อไม่เกิน 60 ตัวอักษร' });
    }

    if (!trimmedMessage || trimmedMessage.length > 500) {
      return res.status(400).json({ error: 'กรุณาเขียนข้อความตั้งแต่ 1 ถึง 500 ตัวอักษร' });
    }

    const wish = {
      id: nanoid(),
      name: trimmedName,
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
      imageFileName: req.file?.filename ?? null
    };

    await addWish(wish);
    invalidateCache(); // Clear cache when new wish is added
    res.status(201).json({ wish: formatWishForResponse(wish) });
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `ไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB` });
    }
    return res.status(400).json({ error: 'อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่' });
  }
  if (err?.code === 'UNSUPPORTED_FILE_TYPE') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง' });
});

// Export for Vercel serverless functions
module.exports = app;

// Start server for local development (only if not imported as module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Birthday wishes API listening on port ${PORT}`);
    if (process.env.NODE_ENV === 'production') {
      console.log(`Serving frontend from http://localhost:${PORT}`);
    }
  });
}
