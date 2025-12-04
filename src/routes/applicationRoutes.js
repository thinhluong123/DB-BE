const express = require('express');
const { authRequired, requireRole } = require('../middlewares/authMiddleware');
const applicationController = require('../controllers/applicationController');

const router = express.Router();

// Employer cập nhật trạng thái ứng tuyển - theo spec: PATCH /api/applications/:jobId/:candidateId/status
router.patch(
  '/:jobId/:candidateId/status',
  authRequired,
  requireRole('EMPLOYER'),
  applicationController.updateApplicationStatus
);

module.exports = router;



