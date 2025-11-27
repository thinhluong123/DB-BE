const candidateService = require('../services/candidateService');
const { successResponse } = require('../utils/response');

const favoriteJob = async (req, res, next) => {
  try {
    const data = await candidateService.favoriteJob(req.params.jobId, { ...req.body, ...req.query });
    return successResponse(res, data, 'Job added to favorites successfully', 201);
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

const getDashboard = async (req, res, next) => {
  try {
    const data = await candidateService.getDashboard({ ...req.query, ...req.body });
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
    const data = await candidateService.listApplications({ ...req.query, ...req.body }, req.query);
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

module.exports = {
  favoriteJob,
  applyJob,
  checkJobStatus,
  getDashboard,
  logout,
  getApplications,
};

