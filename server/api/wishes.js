const cors = require('cors');
const { nanoid } = require('nanoid');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');
const { addWish, readWishes } = require('../src/wishStore');

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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
  // For backward compatibility: support both old imageFileName and new imageUrl
  imageUrl: wish.imageUrl || (wish.imageFileName ? `/api/uploads/${wish.imageFileName}` : null)
});

// Parse form data with file upload
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const uploadsDir = path.join('/tmp', 'uploads');

    // Ensure upload directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: MAX_FILE_BYTES,
      filter: ({ mimetype }) => {
        return ALLOWED_IMAGE_TYPES.has(mimetype);
      }
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      resolve({ fields, files });
    });
  });
};

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
    try {
      const { fields, files } = await parseForm(req);

      const name = (Array.isArray(fields.name) ? fields.name[0] : fields.name || '').trim();
      const message = (Array.isArray(fields.message) ? fields.message[0] : fields.message || '').trim();

      if (!name || name.length > 60) {
        return res.status(400).json({ error: 'กรุณาใส่ชื่อไม่เกิน 60 ตัวอักษร' });
      }

      if (!message || message.length > 500) {
        return res.status(400).json({ error: 'กรุณาเขียนข้อความตั้งแต่ 1 ถึง 500 ตัวอักษร' });
      }

      let imageUrl = null;
      if (files.image) {
        const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
        if (imageFile) {
          // Read the file from temp location
          const fileBuffer = fs.readFileSync(imageFile.filepath);
          const ext = path.extname(imageFile.originalFilename || '') || '.jpg';
          const filename = `wishes/${Date.now()}-${nanoid()}${ext}`;

          // Upload to Vercel Blob
          const blob = await put(filename, fileBuffer, {
            access: 'public',
            contentType: imageFile.mimetype
          });

          imageUrl = blob.url;

          // Clean up temp file
          fs.unlinkSync(imageFile.filepath);
        }
      }

      const wish = {
        id: nanoid(),
        name,
        message,
        createdAt: new Date().toISOString(),
        imageUrl
      };

      await addWish(wish);
      return res.status(201).json({ wish: formatWishForResponse(wish) });
    } catch (error) {
      console.error(error);
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: `ไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB` });
      }
      return res.status(500).json({ error: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
