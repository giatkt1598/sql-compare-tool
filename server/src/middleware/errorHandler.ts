import type { ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Error:', err);

  if (err?.message && err.message.includes('not found')) {
    res.status(404).json({
      success: false,
      message: err.message
    });
    return;
  }

  if (err?.message && err.message.includes('already exists')) {
    res.status(409).json({
      success: false,
      message: err.message
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: err?.message || 'An unexpected error occurred'
  });
};

export default errorHandler;