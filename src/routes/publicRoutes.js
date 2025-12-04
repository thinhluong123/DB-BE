const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();

router.get('/stats', publicController.getStats);
router.get('/categories', publicController.getCategories);
router.get('/companies/top', publicController.getTopCompanies);

module.exports = router;

