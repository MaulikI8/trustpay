const STATUS_CODES = require('../constants/statusCodes');
const MESSAGES = require('../constants/messages');

const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error Caught:', err.message);

  const statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR || 500;
  const message = err.message || MESSAGES.INTERNAL_SERVER_ERROR || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;