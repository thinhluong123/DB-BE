const express = require('express');
const { authRequired, requireRole } = require('../middlewares/authMiddleware');
const jobController = require('../controllers/jobController');
const candidateController = require('../controllers/candidateController');
const employerController = require('../controllers/employerController');
const applicationController = require('../controllers/applicationController');

const router = express.Router();

// Public job list & detail
router.get('/', jobController.getJobs);
router.get('/:jobId', jobController.getJobById);

// Employer xem danh sách ứng tuyển cho 1 job: GET /api/jobs/:jobId/applications
router.get(
  '/:jobId/applications',
  authRequired,
  requireRole('EMPLOYER'),
  applicationController.getJobApplications
);

// Candidate actions: favorite/apply/check-status
router.post(
  '/:jobId/favorite',
  authRequired,
  requireRole('CANDIDATE'),
  candidateController.favoriteJob,
);
router.post(
  '/:jobId/apply',
  authRequired,
  requireRole('CANDIDATE'),
  candidateController.applyJob,
);
router.get(
  '/:jobId/check-status',
  authRequired,
  requireRole('CANDIDATE'),
  candidateController.checkJobStatus,
);

// Employer-only job management
router.post('/', authRequired, requireRole('EMPLOYER'), employerController.createJob);
router.patch('/:jobId/status', authRequired, requireRole('EMPLOYER'), employerController.updateJobStatus);
router.delete('/:jobId', authRequired, requireRole('EMPLOYER'), employerController.deleteJob);

module.exports = router;




