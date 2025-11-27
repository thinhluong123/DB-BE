const createHttpError = require('http-errors');
const candidateModel = require('../models/candidateModel');
const jobModel = require('../models/jobModel');
const { formatCurrencyRange, formatDate } = require('../utils/formatters');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const resolveCandidateId = async (source) => {
  const candidateIdRaw = source?.candidateId || source?.CandidateID || source?.candidateID;
  if (!candidateIdRaw) {
    throw createHttpError(400, 'CandidateID is required');
  }
  const candidateId = candidateModel.toPositiveInt(candidateIdRaw);
  await candidateModel.ensureCandidateExists(candidateId);
  return candidateId;
};

const favoriteJob = async (jobIdRaw, requestData) => {
  const jobId = parseInt(jobIdRaw, 10);
  if (Number.isNaN(jobId)) {
    throw createHttpError(400, 'JobID must be a number');
  }
  const candidateId = await resolveCandidateId(requestData);
  await candidateModel.addFavourite(candidateId, jobId);
  return {
    JobID: jobId,
    favorited: true,
    SaveDate: new Date().toISOString(),
    CandidateID: candidateId,
  };
};

const applyJob = async (jobIdRaw, payload) => {
  const jobId = parseInt(jobIdRaw, 10);
  if (Number.isNaN(jobId)) {
    throw createHttpError(400, 'JobID must be a number');
  }
  const candidateId = await resolveCandidateId(payload);
  const job = await jobModel.fetchJobById(jobId);
  if (!job) {
    throw createHttpError(404, 'Job not found');
  }
  await candidateModel.addApplication(candidateId, jobId, payload);
  return {
    JobID: jobId,
    CandidateID: candidateId,
    Status: 'submitted',
    applied_at: new Date().toISOString(),
  };
};

const checkJobStatus = async (jobIdRaw, requestData) => {
  const jobId = parseInt(jobIdRaw, 10);
  if (Number.isNaN(jobId)) {
    throw createHttpError(400, 'JobID must be a number');
  }
  const candidateId = await resolveCandidateId(requestData);
  const [favorited, applied, job] = await Promise.all([
    candidateModel.isJobFavorited(candidateId, jobId),
    candidateModel.isJobApplied(candidateId, jobId),
    jobModel.fetchJobById(jobId),
  ]);
  if (!job) {
    throw createHttpError(404, 'Job not found');
  }
  return {
    JobID: jobId,
    favorited,
    applied,
    canApply: !applied && job.JobStatus !== 'CLOSED',
    applicationDeadline: formatDate(job.ExpireDate),
  };
};

const getDashboard = async (requestData) => {
  const candidateId = await resolveCandidateId(requestData);
  const [profile, stats, applications] = await Promise.all([
    candidateModel.getCandidateProfile(candidateId),
    candidateModel.getCandidateStats(candidateId),
    candidateModel.getRecentApplications(candidateId),
  ]);

  return {
    user: {
      name: `${profile?.FName || ''} ${profile?.LName || ''}`.trim(),
      avatar: profile?.Profile_Picture || null,
      profileCompletion: profile?.savedCv ? 80 : 50,
    },
    stats: {
      appliedJobs: stats?.appliedJobs || 0,
      favoriteJobs: stats?.favoriteJobs || 0,
      jobAlerts: stats?.jobAlerts || 0,
    },
    recentApplications: applications.map((item) => ({
      id: item.JobID,
      jobId: item.JobID,
      title: item.JobName,
      company: item.CompanyName || 'N/A',
      logo: item.CompanyLogo,
      location: item.Location,
      salary: formatCurrencyRange(item.SalaryFrom, item.SalaryTo),
      type: item.JobType,
      appliedAt: formatDate(item.AppliedDate),
      status: item.Status_apply || 'pending',
    })),
  };
};

const listApplications = async (requestData, query = {}) => {
  const candidateId = await resolveCandidateId(requestData);
  const { page, limit, offset } = getPaginationParams({ page: query.page, limit: query.limit || 20 });

  const [rows, total] = await Promise.all([
    candidateModel.listCandidateApplications(candidateId, limit, offset),
    candidateModel.countCandidateApplications(candidateId),
  ]);

  const applications = rows.map((item) => ({
    JobID: item.JobID,
    title: item.JobName,
    company: item.CompanyName,
    location: item.Location,
    salary: formatCurrencyRange(item.SalaryFrom, item.SalaryTo),
    type: item.JobType,
    status: item.Status_apply || 'pending',
    appliedAt: formatDate(item.AppliedDate),
    coverLetter: item.CoverLetter,
    uploadCV: item.upLoadCV,
  }));

  return {
    applications,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

module.exports = {
  favoriteJob,
  applyJob,
  checkJobStatus,
  getDashboard,
  listApplications,
};

