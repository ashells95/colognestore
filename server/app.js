const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const createAuthRouter = require('./routes/auth');
const createProductRouter = require('./routes/products');
const errorHandler = require('./middleware/errorHandler');
const csrfProtection = require('./middleware/csrfProtection');
const notFound = require('./middleware/notFound');
const healthRouter = require('./routes/health');

function createApp({ clientOrigins, cookieSameSite, jwtSecret }) {
  const app = express();
  const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests. Try again later.' },
  });
  const corsOptions = {
    origin(origin, callback) {
      if (!origin) {
        callback(null, false);
        return;
      }

      if (!clientOrigins.includes(origin)) {
        const error = new Error('Request origin is not allowed.');
        error.status = 403;
        callback(error);
        return;
      }

      callback(null, origin);
    },
    credentials: true,
  };

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use('/api', apiRateLimit);
  app.use(csrfProtection({ clientOrigins, jwtSecret }));
  app.use('/api/auth', createAuthRouter({ cookieSameSite, jwtSecret }));
  app.use('/api/products', createProductRouter({ jwtSecret }));
  app.use('/api/health', healthRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
