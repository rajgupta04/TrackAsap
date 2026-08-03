import logger from '../utils/logger.js';

export const notFound = (req, res, next) => {
  const message = `Not Found — ${req.method} ${req.originalUrl}`;
  logger.warn(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    requestId: req.id,
  });
  const error = new Error(message);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Log the error with appropriate level
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${message}`, {
      method:    req.method,
      url:       req.originalUrl,
      requestId: req.id,
      ip:        req.ip,
      userId:    req.user?._id?.toString(),
      stack:     err.stack,
    });
  } else {
    logger.warn(`[${statusCode}] ${message}`, {
      method:    req.method,
      url:       req.originalUrl,
      requestId: req.id,
      ip:        req.ip,
      userId:    req.user?._id?.toString(),
    });
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
