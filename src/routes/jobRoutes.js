const express = require('express');
const { authRequired, requireRole } = require('../middlewares/authMiddleware');
const jobController = require('../controllers/jobController');
const applicationController = require('../controllers/applicationController');

const router = express.Router();

// Public job list & detail
router.get('/', jobController.listJobs);
router.get('/:jobId', jobController.getJobDetail);

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
  jobController.toggleFavorite
);
router.post(
  '/:jobId/apply',
  authRequired,
  requireRole('CANDIDATE'),
  jobController.applyForJob
);
router.get(
  '/:jobId/check-status',
  authRequired,
  requireRole('CANDIDATE'),
  jobController.checkJobStatus
);

// Employer-only job management
router.post('/', authRequired, requireRole('EMPLOYER'), jobController.createJob);
router.patch('/:jobId/status', authRequired, requireRole('EMPLOYER'), jobController.updateJobStatus);
router.delete('/:jobId', authRequired, requireRole('EMPLOYER'), jobController.deleteJob);

module.exports = router;




