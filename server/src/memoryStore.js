// In-memory storage for wishes (resets when function cold starts)
// This is a temporary solution until we set up a database

let wishes = [];

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
