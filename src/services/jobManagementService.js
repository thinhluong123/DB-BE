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
  deleteJob,
  mapJobToResponse,
};

