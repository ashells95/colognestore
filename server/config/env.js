const port = Number(process.env.PORT ?? 5000);
const mongoUri = process.env.MONGO_URI?.trim();
const jwtSecret = process.env.JWT_SECRET?.trim();
const cookieSameSite = (process.env.COOKIE_SAME_SITE ?? 'lax').toLowerCase();
const clientOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

if (!mongoUri) {
  throw new Error('MONGO_URI is required. Copy .env.example to .env and configure it.');
}

if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
  throw new Error('JWT_SECRET must be set to a random secret of at least 32 bytes.');
}

if (clientOrigins.length === 0) {
  throw new Error('CLIENT_ORIGIN must contain at least one allowed origin.');
}

if (!['strict', 'lax', 'none'].includes(cookieSameSite)) {
  throw new Error('COOKIE_SAME_SITE must be strict, lax, or none.');
}

module.exports = { clientOrigins, cookieSameSite, jwtSecret, mongoUri, port };
