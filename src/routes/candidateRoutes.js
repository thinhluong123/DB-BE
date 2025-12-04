const express = require('express');
const multer = require('multer');
const path = require('path');
const { authRequired, requireRole } = require('../middlewares/authMiddleware');
const candidateController = require('../controllers/candidateController');

const router = express.Router();

// Cấu hình upload đơn giản (lưu local)
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.use(authRequired, requireRole('CANDIDATE'));

// Logout alias: POST /api/candidate/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

router.get('/dashboard', candidateController.getDashboard);
router.get('/applications', candidateController.getApplications);

router.get('/profile', candidateController.getProfile);
router.put('/profile', candidateController.updateProfile);

router.post('/avatar', upload.single('avatar'), candidateController.uploadAvatar);

router.get('/resumes', candidateController.getResumes);
router.post('/resumes', upload.single('file'), candidateController.uploadResume);
router.delete('/resumes/:id', candidateController.deleteResume);

router.put('/password', candidateController.changePassword);

router.get('/notifications', candidateController.getNotifications);
router.put('/notifications/:id/read', candidateController.markNotificationRead);
router.put('/notifications/read-all', candidateController.markAllNotificationsRead);
router.delete('/notifications/:id', candidateController.deleteNotification);
router.get('/notifications/unread', candidateController.getUnreadCount);

module.exports = router;



