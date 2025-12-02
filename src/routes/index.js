const express = require('express');

const authRoutes = require('./auth.routes');
const employerRoutes = require('./employer.routes');
const jobRoutes = require('./job.routes');
const candidateRoutes = require('./candidate.routes');
const applicationRoutes = require('./application.routes');
const statsController = require('../controllers/statsController');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/employer', employerRoutes);
router.use('/jobs', jobRoutes);
router.use('/candidate', candidateRoutes);
router.use('/applications', applicationRoutes);

// Public stats & categories
router.get('/stats', statsController.getGlobalStats);
router.get('/categories', statsController.getCategories);
router.get('/companies/top', statsController.getTopCompanies);

module.exports = router;


