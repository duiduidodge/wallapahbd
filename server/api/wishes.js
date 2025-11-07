const cors = require('cors');
const { nanoid } = require('nanoid');
const Busboy = require('busboy');
const { put } = require('@vercel/blob');
// Use memory store for Vercel (filesystem is ephemeral), file store for local dev
const store = process.env.VERCEL
  ? require('../src/memoryStore')
  : require('../src/wishStore');
const { addWish, readWishes } = store;

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

// Parse form data with file upload using busboy
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    const files = {};

    busboy.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on('file', (fieldname, fileStream, info) => {
      const { filename, mimeType } = info;

      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
        fileStream.resume(); // Drain the stream
        return reject(new Error('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP เท่านั้น'));
      }

      // Collect file data in memory
      const chunks = [];
      let size = 0;

      fileStream.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_FILE_BYTES) {
          fileStream.resume(); // Drain the stream
          return reject(new Error(`ไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB`));
        }
        chunks.push(chunk);
      });

      fileStream.on('end', () => {
        files[fieldname] = {
          buffer: Buffer.concat(chunks),
          filename,
          mimeType,
          size
        };
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, files });
    });

    busboy.on('error', reject);

    req.pipe(busboy);
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
      console.log('POST /api/wishes - starting form parse');
      const { fields, files } = await parseForm(req);
      console.log('POST /api/wishes - form parsed', { fields, files: Object.keys(files || {}) });

      const name = (fields.name || '').trim();
      const message = (fields.message || '').trim();

      if (!name || name.length > 60) {
        return res.status(400).json({ error: 'กรุณาใส่ชื่อไม่เกิน 60 ตัวอักษร' });
      }

      if (!message || message.length > 500) {
        return res.status(400).json({ error: 'กรุณาเขียนข้อความตั้งแต่ 1 ถึง 500 ตัวอักษร' });
      }

      let imageUrl = null;

      if (files.image) {
        const imageFile = files.image;
        const ext = imageFile.filename.includes('.')
          ? '.' + imageFile.filename.split('.').pop()
          : '.jpg';
        const filename = `wishes/${Date.now()}-${nanoid()}${ext}`;

        // Try to use Vercel Blob if available (has token)
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          try {
            console.log('Uploading to Vercel Blob...');
            // Upload to Vercel Blob
            const blob = await put(filename, imageFile.buffer, {
              access: 'public',
              contentType: imageFile.mimeType
            });

            imageUrl = blob.url;
            console.log('Uploaded to Blob successfully:', imageUrl);
          } catch (blobError) {
            console.error('Vercel Blob upload failed:', blobError);
            // For now, just log the error - images won't be stored without Blob
          }
        } else {
          console.log('No BLOB_READ_WRITE_TOKEN - image upload skipped');
        }
      }

      const wish = {
        id: nanoid(),
        name,
        message,
        createdAt: new Date().toISOString(),
        imageUrl
      };

      console.log('POST /api/wishes - adding wish', wish);
      await addWish(wish);
      console.log('POST /api/wishes - wish added successfully');
      return res.status(201).json({ wish: formatWishForResponse(wish) });
    } catch (error) {
      console.error('POST /api/wishes error:', error);
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: `ไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB` });
      }
      // Return detailed error in development
      const errorMessage = process.env.NODE_ENV === 'development'
        ? `${error.message} (${error.code || 'unknown'})`
        : 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง';
      return res.status(500).json({
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
