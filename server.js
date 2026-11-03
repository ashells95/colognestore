require('dotenv').config();

const { createApp } = require('./server/app');
const { connectToDatabase } = require('./server/config/database');
const {
  clientOrigins,
  cookieSameSite,
  jwtSecret,
  mongoUri,
  port,
} = require('./server/config/env');

async function startServer() {
  await connectToDatabase(mongoUri);

  const app = createApp({ clientOrigins, cookieSameSite, jwtSecret });
  app.listen(port, () => {
    console.log(`API server listening on port ${port}.`);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});