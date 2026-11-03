const { isValidCsrfToken, safeTokenEquals } = require('../utils/csrf');

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function csrfProtection({ clientOrigins, jwtSecret }) {
  return (req, res, next) => {
    if (!unsafeMethods.has(req.method)) {
      next();
      return;
    }

    const origin = req.get('origin');
    if (origin && !clientOrigins.includes(origin)) {
      res.status(403).json({ error: 'Request origin is not allowed.' });
      return;
    }

    const cookieToken = req.cookies?.csrfToken;
    const headerToken = req.get('x-csrf-token');
    if (
      !safeTokenEquals(cookieToken, headerToken) ||
      !isValidCsrfToken(cookieToken, jwtSecret)
    ) {
      res.status(403).json({ error: 'CSRF token is missing or invalid.' });
      return;
    }

    next();
  };
}

module.exports = csrfProtection;
