const createHttpError = require('http-errors');
const jobModel = require('../models/jobModel');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { formatCurrencyRange, formatDate, buildJobStatistics } = require('../utils/formatters');

// Helper function để parse array từ query params
// Express tự động parse ?jobType=value1&jobType=value2 thành array
// Hoặc có thể là comma-separated string: ?jobType=value1,value2
const parseArrayParam = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map(item => item.trim()).filter(item => item);
  }
  return value;
};

const parseJobFilters = (query = {}) => ({
  status: query.status || 'all',
  keyword: query.search || query.keyword || '',
  location: query.location,
  jobType: parseArrayParam(query.jobType),
  contractType: parseArrayParam(query.contractType),
  level: parseArrayParam(query.level),
  salaryMin: query.salaryMin || query.salary_min,
  salaryMax: query.salaryMax || query.salary_max,
});

const listJobs = async (query) => {
  const filters = parseJobFilters(query);
  const { page, limit, offset } = getPaginationParams(query);

  const [jobs, total] = await Promise.all([
    jobModel.fetchJobs(filters, limit, offset, query.sortBy),
    jobModel.countJobs(filters),
  ]);

  const payload = jobs.map((job) => ({
    JobID: job.JobID,
    JobName: job.JobName,
    CompanyName: job.CompanyName,
    CompanyLogo: job.CompanyLogo,
    Location: job.Location,
    ContractType: job.ContractType,
    JobType: job.JobType,
    Level: job.Level,
    Salary: formatCurrencyRange(job.SalaryFrom, job.SalaryTo),
    SalaryFrom: job.SalaryFrom,
    SalaryTo: job.SalaryTo,
    RequireExpYear: job.RequiredExpYear,
    Quantity: job.Quantity,
    postDate: formatDate(job.PostDate),
    expireDate: formatDate(job.ExpireDate),
    NumberOfApplicant: job.NumberOfApplicant || 0,
    Views: job.Views || 0,
    featured: Boolean(job.featured),
    urgent: Boolean(job.urgent),
    JobStatus: job.JobStatus,
    statistics: buildJobStatistics(job.NumberOfApplicant || 0, 0, 0),
  }));

  const pagination = buildPaginationMeta(page, limit, total);

  return {
    jobs: payload,
    pagination,
  };
};

const getJobDetails = async (jobId) => {
  if (Number.isNaN(jobId)) {
    throw createHttpError(400, 'JobID must be a number');
  }

  const jobRecord = await jobModel.fetchJobById(jobId);
  if (!jobRecord) {
    throw createHttpError(404, 'Job not found');
  }

  const [categories, skills, applicationStats] = await Promise.all([
    jobModel.fetchJobCategories(jobId),
    jobModel.fetchJobSkills(jobId),
    jobModel.fetchJobApplicationStats(jobId),
  ]);

  const response = {
    JobID: jobRecord.JobID,
    JobName: jobRecord.JobName,
    JD: jobRecord.JD,
    Location: jobRecord.Location,
    salaryFrom: jobRecord.SalaryFrom,
    salaryTo: jobRecord.SalaryTo,
    Salary: formatCurrencyRange(jobRecord.SalaryFrom, jobRecord.SalaryTo),
    Quantity: jobRecord.Quantity,
    RequireExpYear: jobRecord.RequiredExpYear,
    Level: jobRecord.Level,
    ContractType: jobRecord.ContractType,
    JobType: jobRecord.JobType,
    JobStatus: jobRecord.JobStatus,
    postDate: formatDate(jobRecord.PostDate),
    expireDate: formatDate(jobRecord.ExpireDate),
    NumberOfApplicant: jobRecord.NumberOfApplicant || 0,
    Views: jobRecord.Views || 0,
    featured: Boolean(jobRecord.featured),
    urgent: Boolean(jobRecord.urgent),
    statistics: buildJobStatistics(applicationStats.total, applicationStats.approved, applicationStats.declined),
    company: jobRecord.CompanyID
      ? {
          CompanyID: jobRecord.CompanyID,
          CompanyName: jobRecord.CompanyName,
          TaxNumber: jobRecord.TaxNumber,
          Industry: jobRecord.Industry,
          CompanySize: jobRecord.CompanySize,
          Website: jobRecord.Website,
          Nationality: jobRecord.CNationality,
          Logo: jobRecord.Logo,
          Description: jobRecord.Description,
          Address: jobRecord.CompanyAddress,
        }
      : null,
    categories: categories.map((category) => ({
      JCName: category.JCName,
      Speciality: category.Specialty,
    })),
    requiredSkills: skills.map((skill) => ({
      SkillName: skill.SkillName,
      RequiredLevel: skill.RequiredLevel || null,
      IsRequired: true,
      Description: skill.Description,
    })),
  };

  return response;
};

module.exports = {
  listJobs,
  getJobDetails,
};

