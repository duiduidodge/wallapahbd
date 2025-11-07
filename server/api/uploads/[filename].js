const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json({ error: 'Filename required' });
  }

  const filePath = path.join('/tmp', 'uploads', filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Get file extension to set correct content type
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };

  const contentType = contentTypes[ext] || 'application/octet-stream';

  // Set caching headers
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
};
