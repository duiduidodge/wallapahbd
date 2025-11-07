#!/bin/bash

echo "🎂 Building Happy Birthday Wallapa..."

# Build frontend
echo "📦 Building client..."
cd client
npm run build
cd ..

# Copy photos to dist if they exist
if [ -d "client/public/photos" ]; then
  echo "📸 Copying photos to build..."
  mkdir -p client/dist/photos
  cp -r client/public/photos/* client/dist/photos/
fi

echo "✅ Build complete!"
echo ""
echo "To start the production server:"
echo "  cd server"
echo "  NODE_ENV=production npm start"
echo ""
echo "Then visit: http://localhost:4000"
