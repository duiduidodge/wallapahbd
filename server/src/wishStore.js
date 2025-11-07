const fs = require('fs/promises');
const path = require('path');

// Use /tmp for Vercel serverless, local data dir for development
const dataDir = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.join(__dirname, '..', 'data');
const wishesFile = path.join(dataDir, 'wishes.json');

async function ensureDataFile() {
  try {
    await fs.access(wishesFile);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
    const seed = [
      {
        id: 'seed-1',
        name: 'Dodge',
        message: 'You light up every room, happy birthday Wallapa!',
        createdAt: new Date().toISOString(),
        imageFileName: null
      }
    ];
    await fs.writeFile(wishesFile, JSON.stringify(seed, null, 2), 'utf-8');
  }
}

async function readWishes() {
  await ensureDataFile();
  const data = await fs.readFile(wishesFile, 'utf-8');
  return JSON.parse(data);
}

async function writeWishes(wishes) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(wishesFile, JSON.stringify(wishes, null, 2), 'utf-8');
}

async function addWish(newWish) {
  const wishes = await readWishes();
  wishes.unshift(newWish);
  await writeWishes(wishes);
  return newWish;
}

module.exports = {
  addWish,
  readWishes
};
