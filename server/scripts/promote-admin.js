require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const { connectToDatabase } = require('../config/database');
const { mongoUri } = require('../config/env');

async function promoteAdmin() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error('Usage: npm run admin:promote -- customer@example.com');
  }

  await connectToDatabase(mongoUri);
  const user = await User.findOneAndUpdate(
    { email },
    { role: 'admin' },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw new Error(`No account exists for ${email}. Register the account before promoting it.`);
  }

  console.log(`Administrator role granted to ${user.email}.`);
}

promoteAdmin()
  .catch((error) => {
    console.error('Admin promotion failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
