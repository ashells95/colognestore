function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  let status = Number.isInteger(error.status) ? error.status : 500;
  let message = error.message;

  if (error.code === 11000) {
    status = 409;
    message = 'A record with that value already exists.';
  } else if (error.name === 'ValidationError') {
    status = 400;
    message = 'The submitted data is invalid.';
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'A request value is invalid.';
  }

  if (status >= 500) console.error(error);
  res.status(status).json({
    error: status >= 500 ? 'Internal server error.' : message,
  });
}

module.exports = errorHandler;
