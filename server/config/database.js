const mongoose = require('mongoose');

async function connectToDatabase(mongoUri) {
  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 10000,
  });
  console.log('MongoDB connected.');
}

module.exports = { connectToDatabase };
