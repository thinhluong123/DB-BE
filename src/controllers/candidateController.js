const candidateService = require('../services/candidateService');
const { successResponse } = require('../utils/response');

// ===== Job actions =====
const favoriteJob = async (req, res, next) => {
  try {
    const data = await candidateService.favoriteJob(req.params.jobId, { ...req.body, ...req.query });
    return successResponse(res, data, 'Job added to favorites successfully', 201);
  } catch (error) {
    return next(error);
  }
};

const unfavoriteJob = async (req, res, next) => {
  try {
    const data = await candidateService.unfavoriteJob(req.params.jobId, { ...req.body, ...req.query });
    return successResponse(res, data, 'Job removed from favorites successfully');
  } catch (error) {
    return next(error);
  }
};

const applyJob = async (req, res, next) => {
  try {
    const data = await candidateService.applyJob(req.params.jobId, req.body);
    return successResponse(res, data, 'Job application submitted successfully', 201);
  } catch (error) {
    return next(error);
  }
};

const checkJobStatus = async (req, res, next) => {
  try {
    const data = await candidateService.checkJobStatus(req.params.jobId, { ...req.query, ...req.body });
    return successResponse(res, data, 'Job status retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

// ===== Dashboard & lists =====
const getDashboard = async (req, res, next) => {
  try {
    const data = await candidateService.getDashboard(req.query);
    return successResponse(res, data, 'Candidate dashboard retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    return successResponse(res, null, 'Logout successful');
  } catch (error) {
    return next(error);
  }
};

const getApplications = async (req, res, next) => {
  try {
    const data = await candidateService.listApplications(req.query, req.query);
    return res.status(200).json({
      success: true,
      data: {
        applications: data.applications,
      },
      pagination: data.pagination,
      message: 'Applications retrieved successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const getFavorites = async (req, res, next) => {
  try {
    const favorites = await candidateService.getFavorites(req.query);
    return successResponse(res, favorites, 'Favorites retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

// ===== Profile & settings =====
const getProfile = async (req, res, next) => {
  try {
    const data = await candidateService.getProfile(req.query);
    return successResponse(res, data, 'Profile retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    await candidateService.updateProfile({ ...req.query, ...req.body });
    return successResponse(res, null, 'Updated successfully');
  } catch (error) {
    return next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    const data = await candidateService.uploadAvatar({ ...req.query, ...req.body });
    return successResponse(res, data, 'Avatar uploaded successfully');
  } catch (error) {
    return next(error);
  }
};

const getResumes = async (req, res, next) => {
  try {
    const data = await candidateService.getResumes(req.query);
    return successResponse(res, data, 'Resumes retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

const uploadResume = async (req, res, next) => {
  try {
    const data = await candidateService.uploadResume({ ...req.query, ...req.body });
    return successResponse(res, data, 'Resume uploaded successfully');
  } catch (error) {
    return next(error);
  }
};

const deleteResume = async (req, res, next) => {
  try {
    await candidateService.deleteResume({ ...req.query, id: req.params.id });
    return successResponse(res, null, 'Resume deleted successfully');
  } catch (error) {
    return next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await candidateService.changePassword({ ...req.query, ...req.body });
    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    return next(error);
  }
};

// ===== Notifications =====
const getNotifications = async (req, res, next) => {
  try {
    const { notifications, unreadCount } = await candidateService.getNotifications(req.query);
    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
      message: 'Notifications retrieved successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    await candidateService.markNotificationRead({ ...req.query, id: req.params.id });
    return successResponse(res, null, 'Notification marked as read');
  } catch (error) {
    return next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await candidateService.markAllNotificationsRead(req.query);
    return successResponse(res, null, 'All notifications marked as read');
  } catch (error) {
    return next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    await candidateService.deleteNotification({ ...req.query, id: req.params.id });
    return successResponse(res, null, 'Notification deleted successfully');
  } catch (error) {
    return next(error);
  }
};

const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const data = await candidateService.getUnreadNotificationCount(req.query);
    return successResponse(res, data, 'Unread count retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  favoriteJob,
  unfavoriteJob,
  applyJob,
  checkJobStatus,
  getDashboard,
  logout,
  getApplications,
  getFavorites,
  getProfile,
  updateProfile,
  uploadAvatar,
  getResumes,
  uploadResume,
  deleteResume,
  changePassword,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadNotificationCount,
};

