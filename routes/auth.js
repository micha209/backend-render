const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyFirebaseToken } = require('../config/firebase');

// Routes d'authentification
router.post('/register', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court'),
  body('name').optional()
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
], authController.login);

router.post('/verify-token', verifyFirebaseToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token valide',
    user: {
      uid: req.user.uid,
      email: req.user.email,
      emailVerified: req.user.email_verified
    }
  });
});

router.post('/reset-password', [
  body('email').isEmail().withMessage('Email invalide')
], authController.resetPassword);

router.post('/change-password', 
  verifyFirebaseToken,
  [
    body('newPassword').isLength({ min: 6 }).withMessage('Mot de passe trop court')
  ],
  authController.changePassword
);

module.exports = router;