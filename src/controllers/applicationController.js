const applicationService = require('../services/applicationService');
const { successResponse } = require('../utils/response');

const getJobApplications = async (req, res, next) => {
  try {
    const data = await applicationService.listJobApplications(req.params.jobId, req.query);
    return res.status(200).json({
      success: true,
      data: {
        applications: data.applications,
      },
      pagination: data.pagination,
      statistics: data.statistics,
      message: 'Applications retrieved successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const data = await applicationService.updateApplicationStatus(
      req.params.jobId,
      req.params.candidateId,
      req.body.Status_apply,
    );
    return successResponse(res, data, 'Application status updated successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getJobApplications,
  updateApplicationStatus,
};

