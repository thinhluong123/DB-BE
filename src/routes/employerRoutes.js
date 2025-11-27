const express = require('express');
const employerController = require('../controllers/employerController');

const router = express.Router();

router.get('/:employerId/stats', employerController.getStats);
router.get('/:employerId/jobs', employerController.getJobs);
router.get('/:employerId/saved-candidates', employerController.getSavedCandidates);
router.get('/:employerId/notifications', employerController.getNotifications);
router.get('/:employerId/company', employerController.getCompanyInfo);
router.get('/:employerId', employerController.getEmployerProfile);
router.post('/:employerId/follow/:candidateId', employerController.followCandidate);
router.delete('/:employerId/follow/:candidateId', employerController.unfollowCandidate);

module.exports = router;

