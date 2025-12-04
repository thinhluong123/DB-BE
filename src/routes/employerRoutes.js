const express = require('express');
const { authRequired, requireRole } = require('../middlewares/authMiddleware');
const employerController = require('../controllers/employerController');
const jobController = require('../controllers/jobController');
const purchaseController = require('../controllers/purchaseController');

const router = express.Router();

// Tất cả route employer yêu cầu xác thực employer
router.use(authRequired, requireRole('EMPLOYER'));

// Purchase routes - đặt trước routes có :employerId để tránh conflict
router.post('/purchase', purchaseController.createPurchase);

router.get('/:employerId/stats', employerController.getStats);
router.get('/:employerId/jobs', employerController.getEmployerJobs);
router.get('/:employerId/saved-candidates', employerController.getSavedCandidates);
router.get('/:employerId/notifications', employerController.getNotifications);
router.get('/:employerId/packages', purchaseController.getPurchasesByEmployer);
router.get('/:employerId', employerController.getEmployerInfo);
router.get('/:employerId/company', employerController.getCompanyInfo);

// follow / unfollow candidate
router.post('/:employerId/follow/:candidateId', jobController.followCandidate);
router.delete('/:employerId/follow/:candidateId', jobController.unfollowCandidate);

module.exports = router;



