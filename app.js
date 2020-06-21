const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const cookies = require('cookie-parser');
const compression = require('compression');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const morgan = require('morgan');
const app = express();
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// middlewares
// cors
app.use(cors({ origin: 'https://blog-mern-frontend.herokuapp.com', credentials: true }));

// set HTTP headers for security
app.use(helmet());

app.use(morgan('dev'));

// limit the number of requests from an IP
const limiter = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP address. Try again after an hour.',
});
app.use(limiter);

app.use(cookies());

app.use(compression());

app.use(express.json({ limit: '10kb' }));

app.use(express.static(__dirname + '/public'));

app.use('/posts', postRouter);
app.use('/users', userRouter);

app.use('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server.`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
