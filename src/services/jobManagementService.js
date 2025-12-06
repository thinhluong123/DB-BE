const createHttpError = require('http-errors');
const employerModel = require('../models/employerModel');
const jobModel = require('../models/jobModel');
const { formatCurrencyRange, formatDate } = require('../utils/formatters');

const REQUIRED_FIELDS = [
  'JobName',
  'JD',
  'JobType',
  'ContractType',
  'Level',
  'Quantity',
  'SalaryFrom',
  'SalaryTo',
  'RequiredExpYear',
  'Location',
  'PostDate',
  'ExpireDate',
  'JobStatus',
  'EmployerID',
];

const validateJobPayload = (payload) => {
  const missing = REQUIRED_FIELDS.filter((field) => payload[field] === undefined || payload[field] === null);
  if (missing.length) {
    throw createHttpError(400, `Thiếu trường bắt buộc: ${missing.join(', ')}`);
  }
};

const createJob = async (payload) => {
  validateJobPayload(payload);
  const jobId = await employerModel.createJobRecord(payload);
  await employerModel.adjustEmployerOpenedJobs(payload.EmployerID, 1);

  const job = await jobModel.fetchJobById(jobId);
  return {
    JobID: jobId,
    JobName: job?.JobName || payload.JobName,
    JobStatus: job?.JobStatus || payload.JobStatus,
    PostDate: formatDate(job?.PostDate || payload.PostDate),
  };
};

const updateJobStatus = async (jobIdRaw, status) => {
  const jobId = parseInt(jobIdRaw, 10);
  if (Number.isNaN(jobId)) {
    throw createHttpError(400, 'JobID phải là số');
  }
  if (!status) {
    throw createHttpError(400, 'Thiếu JobStatus');
  }
  const updated = await employerModel.updateJobStatus(jobId, status);
  if (!updated) {
    throw createHttpError(404, 'Job không tồn tại');
  }

  const jobRecord = await jobModel.fetchJobById(jobId);
  return {
    JobID: jobId,
    JobStatus: status,
    UpdatedAt: new Date().toISOString(),
    ExpireDate: formatDate(jobRecord?.ExpireDate),
  };
};

const updateJob = async (jobIdRaw, payload) => {
  const jobId = parseInt(jobIdRaw, 10);
  if (Number.isNaN(jobId)) {
    throw createHttpError(400, 'JobID phải là số');
  }

  // Kiểm tra job có tồn tại không
  const existingJob = await jobModel.fetchJobById(jobId);
  if (!existingJob) {
    throw createHttpError(404, 'Job không tồn tại');
  }

  // Validate các trường nếu có trong payload
  if (payload.SalaryFrom !== undefined && payload.SalaryTo !== undefined) {
    if (payload.SalaryFrom <= 0 || payload.SalaryTo <= payload.SalaryFrom) {
      throw createHttpError(400, 'SalaryFrom phải > 0 và SalaryTo phải > SalaryFrom');
    }
  }

  if (payload.Quantity !== undefined && payload.Quantity < 1) {
    throw createHttpError(400, 'Quantity phải >= 1');
  }

  if (payload.PostDate && payload.ExpireDate) {
    const postDate = new Date(payload.PostDate);
    const expireDate = new Date(payload.ExpireDate);
    if (expireDate <= postDate) {
      throw createHttpError(400, 'ExpireDate phải > PostDate');
    }
  }

  await employerModel.updateJobRecord(jobId, payload);

  const updatedJob = await jobModel.fetchJobById(jobId);
  return {
    JobID: jobId,
    JobName: updatedJob?.JobName,
    JobStatus: updatedJob?.JobStatus,
    PostDate: formatDate(updatedJob?.PostDate),
    ExpireDate: formatDate(updatedJob?.ExpireDate),
    UpdatedAt: new Date().toISOString(),
  };
};

const deleteJob = async (jobIdRaw) => {
  const jobId = parseInt(jobIdRaw, 10);
  if (Number.isNaN(jobId)) {
    throw createHttpError(400, 'JobID phải là số');
  }

  const jobRecord = await jobModel.fetchJobById(jobId);
  if (!jobRecord) {
    throw createHttpError(404, 'Job không tồn tại');
  }

  await employerModel.deleteJobById(jobId);
  await employerModel.adjustEmployerOpenedJobs(jobRecord.EmployerID, -1);

  return true;
};

const mapJobToResponse = (job) => ({
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
});

module.exports = {
  createJob,
  updateJobStatus,
  updateJob,
  deleteJob,
  mapJobToResponse,
};

