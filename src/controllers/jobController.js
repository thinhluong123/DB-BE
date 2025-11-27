const jobService = require('../services/jobService');
const { successResponse } = require('../utils/response');

const getJobs = async (req, res, next) => {
  try {
    const { jobs, pagination } = await jobService.listJobs(req.query);
    return res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination,
      },
      message: 'Jobs retrieved successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    const jobDetails = await jobService.getJobDetails(jobId);
    return successResponse(res, jobDetails, 'Job details retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getJobs,
  getJobById,
};

