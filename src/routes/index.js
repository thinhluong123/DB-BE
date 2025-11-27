const express = require('express');
const publicRoutes = require('./publicRoutes');
const jobRoutes = require('./jobRoutes');
const employerRoutes = require('./employerRoutes');
const applicationRoutes = require('./applicationRoutes');
const candidateRoutes = require('./candidateRoutes');

const router = express.Router();

router.use('/', publicRoutes);
router.use('/jobs', jobRoutes);
router.use('/employer', employerRoutes);
router.use('/applications', applicationRoutes);
router.use('/candidate', candidateRoutes);

module.exports = router;

