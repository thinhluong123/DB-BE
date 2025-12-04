const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Candidate auth routes
router.post('/register-candidate', authController.registerCandidate);
router.post('/login-candidate', authController.loginCandidate);

// Employer auth routes
router.post('/register-employer', authController.registerEmployer);
router.post('/login-employer', authController.loginEmployer);

// Common routes
router.post('/logout', authController.logout);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;

