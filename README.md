# Happy Birthday Wallapa

A tiny full-stack web app where friends and family can post heartfelt birthday wishes for Wallapa. The project contains a Vite + React frontend and an Express backend that persists wishes to a JSON file.

## Features
- Beautiful wish wall with live-updating list of submissions
- Simple form validation with friendly status messages
- Optional photo attachments with size/type validation
- Lightweight API with JSON persistence (no external database required)
- Configurable API base URL for deploying the frontend separately

## Tech Stack
- **Frontend:** React 19, Vite, TypeScript
- **Backend:** Node.js, Express 5
- **Persistence:** Flat JSON file stored in `server/data/wishes.json`

## Getting Started
Prerequisites: Node.js 18+ and npm.

### 1. Backend API
```bash
cd server
npm install
npm run dev
```
The API listens on port `4000` by default. Wishes are stored in `server/data/wishes.json`; the file will be created automatically on first run.
Uploaded images are saved under `server/uploads/` and served from `/uploads/...`.

### 2. Frontend
```bash
cd client
cp .env.example .env   # optional, defaults to http://localhost:4000
npm install
npm run dev
```
The Vite dev server runs on port `5173`. Visit `http://localhost:5173` while the backend is also running.

### Production Build & Deployment

**Option 1: Quick Deploy (Recommended)**
```bash
./deploy.sh
cd server
NODE_ENV=production npm start
```
Access the app at `http://localhost:4000`

**Option 2: Manual Build**
```bash
cd client
npm run build
cd ../server
NODE_ENV=production npm start
```

The production server serves both the frontend and API from a single port (4000).

## Project Structure
```
HBD Wallapa/
├── client/    # React frontend
└── server/    # Express API with JSON persistence
```

## Next Ideas
1. Deploy the backend on a tiny host (Render, Fly.io) and point `VITE_API_URL` to the public URL.
2. Swap the JSON store for a managed database (Supabase, MongoDB Atlas) for higher reliability.
3. Add admin moderation endpoints or simple password protection if you want to curate the wall.
