const jwt = require('jsonwebtoken');
const createHttpError = require('http-errors');
const config = require('../config/env');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createHttpError(401, 'Authorization header is missing'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload;
    return next();
  } catch (error) {
    return next(createHttpError(401, 'Invalid or expired token'));
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload;
  } catch (error) {
    // ignore invalid token for optional auth
  }
  return next();
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(createHttpError(401, 'Unauthorized'));
  }
  if (!roles.includes(req.user.role)) {
    return next(createHttpError(403, 'Forbidden'));
  }
  return next();
};

module.exports = {
  authenticate,
  optionalAuth,
  authorizeRoles,
};

