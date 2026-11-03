const express = require('express');
const rateLimit = require('express-rate-limit');
const { createAuthController } = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');
const validateRequest = require('../validators/request');
const { loginSchema, registerSchema } = require('../validators/auth');

function createAuthRouter(authConfig) {
  const router = express.Router();
  const controller = createAuthController(authConfig);
  const { jwtSecret } = authConfig;
  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Try again later.' },
  });

  router.get('/csrf', controller.csrf);
  router.post('/register', authRateLimit, validateRequest(registerSchema), controller.register);
  router.post('/login', authRateLimit, validateRequest(loginSchema), controller.login);
  router.post('/logout', authenticate(jwtSecret), controller.logout);
  router.get('/me', authenticate(jwtSecret), controller.me);

  return router;
}

module.exports = createAuthRouter;
