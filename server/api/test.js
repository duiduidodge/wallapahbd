module.exports = (req, res) => {
  res.status(200).json({ status: 'test working', timestamp: new Date().toISOString() });
};
