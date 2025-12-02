const employerService = require('../services/employerService');
const jobManagementService = require('../services/jobManagementService');
const { successResponse } = require('../utils/response');

const getStats = async (req, res, next) => {
  try {
    const data = await employerService.getDashboardStats(req.params.employerId);
    return successResponse(res, data, 'Stats retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const data = await employerService.getEmployerJobs(req.params.employerId, req.query);
    return res.status(200).json({
      success: true,
      data: {
        jobs: data.jobs,
      },
      pagination: data.pagination,
      message: 'Jobs retrieved successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const getSavedCandidates = async (req, res, next) => {
  try {
    const data = await employerService.getSavedCandidates(req.params.employerId, req.query);
    return res.status(200).json({
      success: true,
      data: {
        candidates: data.candidates,
      },
      pagination: data.pagination,
      message: 'Saved candidates retrieved successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const data = await employerService.getNotifications(req.params.employerId, req.query);
    return res.status(200).json({
      success: true,
      data: {
        notifications: data.notifications,
      },
      pagination: data.pagination,
      unreadCount: data.unreadCount,
      message: 'Notifications retrieved successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const getEmployerProfile = async (req, res, next) => {
  try {
    const data = await employerService.getEmployerProfile(req.params.employerId);
    return successResponse(res, data, 'Employer profile retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

const getCompanyInfo = async (req, res, next) => {
  try {
    const data = await employerService.getCompanyInfo(req.params.employerId);
    return successResponse(res, data, 'Company info retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

const followCandidate = async (req, res, next) => {
  try {
    const data = await employerService.followCandidate(req.params.employerId, req.params.candidateId);
    return successResponse(res, data, 'Candidate followed successfully', 201);
  } catch (error) {
    return next(error);
  }
};

const unfollowCandidate = async (req, res, next) => {
  try {
    await employerService.unfollowCandidate(req.params.employerId, req.params.candidateId);
    return successResponse(res, null, 'Candidate unfollowed successfully');
  } catch (error) {
    return next(error);
  }
};

const createJob = async (req, res, next) => {
  try {
    const job = await jobManagementService.createJob(req.body);
    return successResponse(res, job, 'Job posted successfully', 201);
  } catch (error) {
    return next(error);
  }
};

const updateJobStatus = async (req, res, next) => {
  try {
    const job = await jobManagementService.updateJobStatus(req.params.jobId, req.body.JobStatus);
    return successResponse(res, job, 'Job status updated successfully');
  } catch (error) {
    return next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    await jobManagementService.deleteJob(req.params.jobId);
    return successResponse(res, null, 'Job deleted successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getStats,
  getJobs,
  getSavedCandidates,
  getNotifications,
  getEmployerProfile,
  getCompanyInfo,
  followCandidate,
  unfollowCandidate,
  createJob,
  updateJobStatus,
  deleteJob,
};

