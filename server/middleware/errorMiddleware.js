export function notFoundHandler(req, res, next) {
  const error = new Error(`Resource not found on endpoint: ${req.originalUrl}`);
  res.status(404);
  next(error);
}

export function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`[Error] [${req.method} ${req.url}]:`, err.message);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}
