const express = require('express');
const candidateController = require('../controllers/candidateController');

const router = express.Router();

// Dashboard & activity
router.get('/dashboard', candidateController.getDashboard);
router.post('/logout', candidateController.logout);
router.get('/applications', candidateController.getApplications);
router.get('/favorites', candidateController.getFavorites);

// Profile
router.get('/profile', candidateController.getProfile);
router.put('/profile', candidateController.updateProfile);

// Avatar & resume
router.post('/avatar', candidateController.uploadAvatar);
router.get('/resumes', candidateController.getResumes);
router.post('/resumes', candidateController.uploadResume);
router.delete('/resumes/:id', candidateController.deleteResume);

// Password
router.put('/password', candidateController.changePassword);

// Notifications
router.get('/notifications', candidateController.getNotifications);
router.put('/notifications/:id/read', candidateController.markNotificationRead);
router.put('/notifications/read-all', candidateController.markAllNotificationsRead);
router.delete('/notifications/:id', candidateController.deleteNotification);
router.get('/notifications/unread', candidateController.getUnreadNotificationCount);

module.exports = router;

