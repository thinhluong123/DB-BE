const createHttpError = require('http-errors');
const applicationModel = require('../models/applicationModel');
const { formatDate } = require('../utils/formatters');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const listJobApplications = async (jobIdRaw, query = {}) => {
  const jobId = parseInt(jobIdRaw, 10);
  if (Number.isNaN(jobId)) {
    throw createHttpError(400, 'JobID phải là số');
  }

  const status = query.status || 'all';
  const { page, limit, offset } = getPaginationParams({ page: query.page, limit: query.limit || 20 });

  const [applications, total, statistics] = await Promise.all([
    applicationModel.getJobApplications(jobId, status, limit, offset),
    applicationModel.countJobApplications(jobId, status),
    applicationModel.getApplicationStatistics(jobId),
  ]);

  const formatted = applications.map((item) => ({
    CandidateID: item.CandidateID,
    JobID: item.JobID,
    upLoadCV: item.upLoadCV,
    CoverLetter: item.CoverLetter,
    Status_apply: item.Status_apply || null,
    AppliedDate: formatDate(item.AppliedDate),
    candidate: {
      FName: item.FName,
      LName: item.LName,
      Email: item.Email,
      Phonenumber: item.Phonenumber,
      Profile_Picture: item.Profile_Picture,
      Address: item.Address,
    },
    profile: {
      YearOfExperience: item.YearOfExperience || 0,
      savedCv: item.savedCv || null,
    },
  }));

  return {
    applications: formatted,
    pagination: buildPaginationMeta(page, limit, total),
    statistics,
  };
};

const updateApplicationStatus = async (jobIdRaw, candidateIdRaw, status) => {
  if (!status) {
    throw createHttpError(400, 'Status_apply là bắt buộc');
  }
  const jobId = parseInt(jobIdRaw, 10);
  const candidateId = parseInt(candidateIdRaw, 10);
  if (Number.isNaN(jobId) || Number.isNaN(candidateId)) {
    throw createHttpError(400, 'JobID và CandidateID phải là số');
  }
  const affected = await applicationModel.updateApplicationStatus(jobId, candidateId, status);
  if (!affected) {
    throw createHttpError(404, 'Không tìm thấy bản ghi ứng tuyển');
  }
  return {
    JobID: jobId,
    CandidateID: candidateId,
    Status_apply: status,
    UpdatedAt: new Date().toISOString(),
  };
};

module.exports = {
  listJobApplications,
  updateApplicationStatus,
};

