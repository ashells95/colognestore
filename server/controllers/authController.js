const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isValidCsrfToken, issueCsrfToken } = require('../utils/csrf');

const authCookieOptions = (isProduction, cookieSameSite) => ({
  httpOnly: true,
  secure: isProduction || cookieSameSite === 'none',
  sameSite: cookieSameSite,
  path: '/',
  maxAge: 60 * 60 * 1000,
});

const csrfCookieOptions = (isProduction, cookieSameSite) => ({
  httpOnly: false,
  secure: isProduction || cookieSameSite === 'none',
  sameSite: cookieSameSite,
  path: '/',
  maxAge: 60 * 60 * 1000,
});

function setCsrfCookie(req, res, { cookieSameSite, jwtSecret }) {
  const existingToken = req.cookies?.csrfToken;
  const token = isValidCsrfToken(existingToken, jwtSecret)
    ? existingToken
    : issueCsrfToken(jwtSecret);
  res.cookie(
    'csrfToken',
    token,
    csrfCookieOptions(req.app.get('env') === 'production', cookieSameSite),
  );
  return token;
}

function setAuthCookie(req, res, user, { cookieSameSite, jwtSecret }) {
  const token = jwt.sign({ sub: user.id }, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: 'colognestore-api',
    audience: 'colognestore-client',
  });

  res.cookie(
    'authToken',
    token,
    authCookieOptions(req.app.get('env') === 'production', cookieSameSite),
  );
}

function createAuthController(authConfig) {
  return {
    csrf(req, res) {
      const token = setCsrfCookie(req, res, authConfig);
      res.json({ csrfToken: token });
    },

    async register(req, res, next) {
      try {
        const { name, email, password } = req.validated.body;
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, passwordHash });

        setAuthCookie(req, res, user, authConfig);
        res.status(201).json({ user: user.toJSON() });
      } catch (error) {
        next(error);
      }
    },

    async login(req, res, next) {
      try {
        const { email, password } = req.validated.body;
        const user = await User.findOne({ email }).select('+passwordHash');
        const passwordIsValid =
          user && (await bcrypt.compare(password, user.passwordHash));

        if (!passwordIsValid) {
          res.status(401).json({ error: 'Email or password is incorrect.' });
          return;
        }

        setAuthCookie(req, res, user, authConfig);
        res.json({ user: user.toJSON() });
      } catch (error) {
        next(error);
      }
    },

    logout(req, res) {
      res.clearCookie(
        'authToken',
        authCookieOptions(req.app.get('env') === 'production', authConfig.cookieSameSite),
      );
      res.status(204).end();
    },

    me(req, res) {
      res.json({ user: req.user.toJSON() });
    },
  };
}

module.exports = { createAuthController };
