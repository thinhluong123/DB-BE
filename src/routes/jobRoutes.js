const express = require('express');
const jobController = require('../controllers/jobController');
const employerController = require('../controllers/employerController');
const applicationController = require('../controllers/applicationController');
const candidateController = require('../controllers/candidateController');

const router = express.Router();

router.get('/', jobController.getJobs);
router.post('/', employerController.createJob);
router.patch('/:jobId/status', employerController.updateJobStatus);
router.delete('/:jobId', employerController.deleteJob);
router.get('/:jobId/applications', applicationController.getJobApplications);
router.post('/:jobId/favorite', candidateController.favoriteJob);
router.delete('/:jobId/favorite', candidateController.unfavoriteJob);
router.post('/:jobId/apply', candidateController.applyJob);
router.get('/:jobId/check-status', candidateController.checkJobStatus);
router.get('/:jobId', jobController.getJobById);

module.exports = router;

