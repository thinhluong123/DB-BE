const express = require('express');
const employerController = require('../controllers/employerController');
const packageController = require('../controllers/packageController');

const router = express.Router();

router.post('/purchase', packageController.purchasePackage);
router.get('/:employerId/packages', packageController.getEmployerPackages);
router.get('/:employerId/stats', employerController.getStats);
router.get('/:employerId/jobs', employerController.getJobs);
router.get('/:employerId/saved-candidates', employerController.getSavedCandidates);
router.get('/:employerId/notifications', employerController.getNotifications);
router.get('/:employerId/company', employerController.getCompanyInfo);
router.get('/:employerId', employerController.getEmployerProfile);
router.post('/:employerId/follow/:candidateId', employerController.followCandidate);
router.delete('/:employerId/follow/:candidateId', employerController.unfollowCandidate);

module.exports = router;

