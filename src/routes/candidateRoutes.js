const express = require('express');
const candidateController = require('../controllers/candidateController');

const router = express.Router();

router.get('/dashboard', candidateController.getDashboard);
router.post('/logout', candidateController.logout);
router.get('/applications', candidateController.getApplications);
router.get('/favorites', candidateController.getFavorites);

module.exports = router;

