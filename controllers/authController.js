const crypto = require('crypto');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const { promisify } = require('util');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendJWT = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    // domain: 'http://localhost:3000',
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.createUser = catchAsync(async (req, res, next) => {
  const {
    username,
    email,
    password,
    passwordConfirm,
    photo,
    passwordChangedAt,
  } = req.body;

  const newUser = await User.create({
    username: username,
    email: email,
    password: password,
    passwordConfirm: passwordConfirm,
    photo: photo,
    passwordChangedAt: passwordChangedAt,
  });

  createAndSendJWT(newUser, 201, res);
});

exports.loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError('please provide email and password', 401));

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('email or password is incorrect', 401));
  }

  createAndSendJWT(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1 check if token is present or not
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please login to get access', 401)
    );
  }

  // 2 verify token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3 check if user still exists
  const freshUser = await User.findById(decode.id);
  if (!freshUser)
    return next(
      new AppError('User belonging to this token is not exists.', 401)
    );

  // 4 check if user changed password after token was issued
  if (freshUser.changePasswordAfter(decode.iat)) {
    return next(new AppError('User has recently changed his password.', 401));
  }

  // Access granted
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not allowed to perform this action.', 401)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1 find user by email address
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new AppError('There is no user with this email', 404));

  // 2 generate password reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3 send email
  const resetURL = `http://localhost:3000/resetPassword/${resetToken}`;

  const message = ` Forgot password? Go to the given link and reset your password. ${resetURL}. \n If you don't forget please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token is valid for 10 minutes',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'token has been sent to your email.',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('there was an error sending email.'));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 get user based on resetToken
  const hashedResetToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  console.log(hashedResetToken);

  const user = await User.findOne({
    passwordResetToken: hashedResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  console.log(user);
  // 2 if there is no user or resetToken then send the error
  if (!user) return next(new AppError('Token is invalid or expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3 update changePasswordAt property

  // 4 log the user in , send jwt
  createAndSendJWT(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // get the user
  const user = await User.findById(req.user.id).select('+password');

  // 2 check if the current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your currnet password is incorrect.', 400));
  }

  // 3 if so update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4 log in the use and send jwt
  createAndSendJWT(user, 200, res);
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // 1 check if token is present or not
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in. Please login to get access', 401)
    );
  }

  // 2 verify token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3 check if user still exists
  const freshUser = await User.findById(decode.id);
  if (!freshUser)
    return next(
      new AppError('User belonging to this token is not exists.', 401)
    );

  // 4 check if user changed password after token was issued
  if (freshUser.changePasswordAfter(decode.iat)) {
    return next(new AppError('User has recently changed his password.', 401));
  }

  res.status(200).json({
    status: 'success',
    user: freshUser,
  });
});

exports.logoutUser = catchAsync(async (req, res, next) => {
  res.clearCookie('jwt');

  res.status(200).json({
    status: 'success',
    message: 'User logout successfully.',
  });
});
