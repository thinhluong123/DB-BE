const createHttpError = require('http-errors');
const { errorResponse } = require('../utils/response');

const notFoundHandler = (req, res, next) => {
  next(createHttpError(404, `Route ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return errorResponse(res, statusCode, message, err.errors);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

