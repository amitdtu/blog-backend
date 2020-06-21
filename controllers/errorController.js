const AppError = require('../utils/appError');

const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // log the error
    console.error('Error ', err);

    // send generic error
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong.',
    });
  }
};

const handleInvalidJWT = () =>
  new AppError('Token is invalid. Please login again', 401);

const handleExpiredJWT = () =>
  new AppError('Token is expired. Please login again', 401);

module.exports = (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'JsonWebTokenError') error = handleInvalidJWT();
    if (error.name === 'TokenExpiredError') error = handleExpiredJWT();

    sendErrProd(error, res);
  }
};
