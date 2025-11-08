const { kv } = require('@vercel/kv');

const WISHES_KEY = 'birthday-wishes';

async function readWishes() {
  try {
    const wishes = await kv.get(WISHES_KEY);
    return wishes || [];
  } catch (error) {
    console.error('Error reading from KV:', error);
    return [];
  }
}

async function addWish(newWish) {
  try {
    const wishes = await readWishes();
    wishes.unshift(newWish);
    await kv.set(WISHES_KEY, wishes);
    return newWish;
  } catch (error) {
    console.error('Error adding wish to KV:', error);
    throw error;
  }
}

module.exports = {
  addWish,
  readWishes
};
