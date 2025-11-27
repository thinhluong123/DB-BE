const createHttpError = require('http-errors');
const employerModel = require('../models/employerModel');
const applicationModel = require('../models/applicationModel');
const { formatCurrencyRange, formatDate } = require('../utils/formatters');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const parseEmployerId = (rawId) => {
  const employerId = parseInt(rawId, 10);
  if (Number.isNaN(employerId)) {
    throw createHttpError(400, 'EmployerID phải là số');
  }
  return employerId;
};

const getDashboardStats = async (employerIdRaw) => {
  const employerId = parseEmployerId(employerIdRaw);
  const stats = await employerModel.getDashboardStats(employerId);
  if (!stats) {
    throw createHttpError(404, 'Employer không tồn tại');
  }
  const newApplicationsToday = await applicationModel.countNewApplicationsToday(employerId);

  return {
    NumberOfOpenedJob: stats.NumberOfOpenedJob || 0,
    savedCandidates: stats.totalFollowers || 0,
    totalFollowers: stats.totalFollowers || 0,
    totalApplications: stats.totalApplications || 0,
    newApplicationsToday,
    activeJobs: stats.activeJobs || 0,
    expiredJobs: stats.expiredJobs || 0,
    openJobs: stats.activeJobs || 0,
  };
};

const getEmployerJobs = async (employerIdRaw, query = {}) => {
  const employerId = parseEmployerId(employerIdRaw);
  const status = query.status || 'all';
  const { page, limit } = getPaginationParams(query);
  const { jobs, total } = await employerModel.getEmployerJobs(employerId, status, page, limit);

  const formattedJobs = jobs.map((job) => ({
    JobID: job.JobID,
    JobName: job.JobName,
    JobType: job.JobType,
    ContractType: job.ContractType,
    Level: job.Level,
    PostDate: formatDate(job.PostDate),
    ExpireDate: formatDate(job.ExpireDate),
    JobStatus: job.JobStatus,
    NumberOfApplicant: job.NumberOfApplicant || 0,
    Location: job.Location,
    SalaryFrom: job.SalaryFrom,
    SalaryTo: job.SalaryTo,
    Salary: formatCurrencyRange(job.SalaryFrom, job.SalaryTo),
    Quantity: job.Quantity,
    RequiredExpYear: job.RequiredExpYear,
  }));

  const pagination = buildPaginationMeta(page, limit, total);
  return { jobs: formattedJobs, pagination };
};

const getSavedCandidates = async (employerIdRaw, query = {}) => {
  const employerId = parseEmployerId(employerIdRaw);
  const { page, limit } = getPaginationParams({ page: query.page, limit: query.limit || 20 });
  const { candidates, total } = await employerModel.getSavedCandidates(employerId, page, limit);

  const formatted = candidates.map((candidate) => ({
    CandidateID: candidate.CandidateID,
    FName: candidate.FName,
    LName: candidate.LName,
    Email: candidate.Email,
    Phonenumber: candidate.Phonenumber,
    Profile_Picture: candidate.Profile_Picture,
    Address: candidate.Address,
    followDate: null,
    profile: {
      YearOfExperience: candidate.YearOfExperience || 0,
      savedCv: candidate.savedCv || null,
    },
  }));

  return {
    candidates: formatted,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getNotifications = async (employerIdRaw, query = {}) => {
  const employerId = parseEmployerId(employerIdRaw);
  const { page, limit } = getPaginationParams({ page: query.page, limit: query.limit || 10 });
  const { notifications, total } = await employerModel.getNotifications(employerId, page, limit);

  const formatted = notifications.map((item) => ({
    nID: item.nID,
    Title: item.Title,
    Content: item.Content,
    Time: formatDate(item.Time),
    JobID: item.JobID,
    CandidateID: item.CandidateID,
    isRead: false,
  }));

  return {
    notifications: formatted,
    pagination: buildPaginationMeta(page, limit, total),
    unreadCount: 0,
  };
};

const getEmployerProfile = async (employerIdRaw) => {
  const employerId = parseEmployerId(employerIdRaw);
  const profile = await employerModel.getEmployerProfile(employerId);
  if (!profile) {
    throw createHttpError(404, 'Employer không tồn tại');
  }

  return {
    employer: {
      ID: profile.ID,
      Username: profile.Username,
      Email: profile.Email,
      FName: profile.FName,
      LName: profile.LName,
      Phonenumber: profile.Phonenumber,
      Address: profile.Address,
      Profile_Picture: profile.Profile_Picture,
      PackageName: profile.PackageName,
      NumberOfOpenedJob: profile.NumberOfOpenedJob || 0,
      purchaseDate: profile.purchaseDate,
    },
    package: profile.PackageName
      ? {
          PackageName: profile.PackageName,
          cost: profile.cost,
          description: profile.desciption,
          time: profile.time,
        }
      : null,
  };
};

const getCompanyInfo = async (employerIdRaw) => {
  const employerId = parseEmployerId(employerIdRaw);
  const company = await employerModel.getEmployerCompany(employerId);
  if (!company) {
    throw createHttpError(404, 'Chưa có thông tin công ty');
  }
  return company;
};

const followCandidate = async (employerIdRaw, candidateIdRaw) => {
  const employerId = parseEmployerId(employerIdRaw);
  const candidateId = parseInt(candidateIdRaw, 10);
  if (Number.isNaN(candidateId)) {
    throw createHttpError(400, 'CandidateID phải là số');
  }
  await employerModel.followCandidate(employerId, candidateId);
  return { EmployerID: employerId, CandidateID: candidateId };
};

const unfollowCandidate = async (employerIdRaw, candidateIdRaw) => {
  const employerId = parseEmployerId(employerIdRaw);
  const candidateId = parseInt(candidateIdRaw, 10);
  if (Number.isNaN(candidateId)) {
    throw createHttpError(400, 'CandidateID phải là số');
  }
  const removed = await employerModel.unfollowCandidate(employerId, candidateId);
  if (!removed) {
    throw createHttpError(404, 'Không tìm thấy follow record');
  }
  return { EmployerID: employerId, CandidateID: candidateId };
};

module.exports = {
  getDashboardStats,
  getEmployerJobs,
  getSavedCandidates,
  getNotifications,
  getEmployerProfile,
  getCompanyInfo,
  followCandidate,
  unfollowCandidate,
};

