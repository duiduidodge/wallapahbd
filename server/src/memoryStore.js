// In-memory storage for wishes (resets when function cold starts)
// This is a temporary solution until we set up a database

let wishes = [
  {
    id: 'seed-1',
    name: 'Dodge',
    message: 'You light up every room, happy birthday Wallapa!',
    createdAt: new Date().toISOString(),
    imageUrl: null,
    imageFileName: null
  }
];

async function readWishes() {
  return [...wishes]; // Return a copy
}

async function addWish(newWish) {
  wishes.unshift(newWish);
  return newWish;
}

module.exports = {
  addWish,
  readWishes
};
