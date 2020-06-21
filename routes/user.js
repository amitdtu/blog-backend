const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.createUser);
router.post('/login', authController.loginUser);
router.get('/logout', authController.protect, authController.logoutUser);
router.get('/isLoggedIn', authController.isLoggedIn);

router.post(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword/:resetToken', authController.resetPassword);

module.exports = router;
