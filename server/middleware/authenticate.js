const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authenticate(jwtSecret) {
  return async (req, res, next) => {
    const token = req.cookies?.authToken;
    if (!token) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret, {
        algorithms: ['HS256'],
        issuer: 'colognestore-api',
        audience: 'colognestore-client',
      });
    } catch {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!payload || typeof payload !== 'object' || typeof payload.sub !== 'string') {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    try {
      const user = await User.findById(payload.sub).select('_id name email role');
      if (!user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access required.' });
    return;
  }

  next();
}

module.exports = { authenticate, requireAdmin };
