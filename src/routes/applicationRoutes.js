const express = require('express');
const applicationController = require('../controllers/applicationController');

const router = express.Router();

router.patch('/:jobId/:candidateId/status', applicationController.updateApplicationStatus);

module.exports = router;

