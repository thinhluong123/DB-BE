const createHttpError = require('http-errors');
const { executeQuery } = require('../config/database');
const { detectApplicationColumns } = require('./applicationModel');

const toPositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw createHttpError(400, 'CandidateID must be a positive number');
  }
  return parsed;
};

const ensureCandidateExists = async (candidateId) => {
  const rows = await executeQuery('SELECT ID FROM candidate WHERE ID = ?', [candidateId]);
  if (!rows.length) {
    throw createHttpError(404, 'Candidate not found');
  }
};

const addFavourite = async (candidateId, jobId) =>
  executeQuery(
    `
    INSERT INTO favourite (CandidateID, JobID, \`Date\`)
    VALUES (?, ?, CURDATE())
    ON DUPLICATE KEY UPDATE \`Date\` = VALUES(\`Date\`)
  `,
    [candidateId, jobId],
  );

const isJobFavorited = async (candidateId, jobId) => {
  const rows = await executeQuery('SELECT 1 FROM favourite WHERE CandidateID = ? AND JobID = ?', [candidateId, jobId]);
  return rows.length > 0;
};

const isJobApplied = async (candidateId, jobId) => {
  const rows = await executeQuery('SELECT 1 FROM apply WHERE CandidateID = ? AND JobID = ?', [candidateId, jobId]);
  return rows.length > 0;
};

const addApplication = async (candidateId, jobId, payload) =>
  executeQuery(
    `
    INSERT INTO apply (CandidateID, JobID, upLoadCV, CoverLetter)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      upLoadCV = VALUES(upLoadCV),
      CoverLetter = VALUES(CoverLetter)
  `,
    [candidateId, jobId, payload.upLoadCV || payload.uploadCV || null, payload.CoverLetter || null],
  );

const getCandidateProfile = async (candidateId) => {
  const rows = await executeQuery(
    `
    SELECT 
      u.FName,
      u.LName,
      u.Profile_Picture,
      p.savedCv,
      p.YearOfExperience,
      u.Email
    FROM user u
    JOIN candidate c ON c.ID = u.ID
    LEFT JOIN profile p ON p.CandidateID = c.ID
    WHERE c.ID = ?
  `,
    [candidateId],
  );
  return rows[0];
};

const getCandidateStats = async (candidateId) => {
  const rows = await executeQuery(
    `
    SELECT
      (SELECT COUNT(*) FROM apply WHERE CandidateID = ?) AS appliedJobs,
      (SELECT COUNT(*) FROM favourite WHERE CandidateID = ?) AS favoriteJobs,
      0 AS jobAlerts
  `,
    [candidateId, candidateId],
  );
  return rows[0];
};

const buildApplicationSelectFields = async () => {
  const { hasStatus, hasAppliedDate } = await detectApplicationColumns();
  return {
    statusField: hasStatus ? 'a.Status_apply' : "NULL AS Status_apply",
    appliedDateField: hasAppliedDate ? 'a.AppliedDate' : "NULL AS AppliedDate",
    orderField: hasAppliedDate ? 'a.AppliedDate' : 'a.JobID',
  };
};

const getRecentApplications = async (candidateId, limit = 5) => {
  const { statusField, appliedDateField, orderField } = await buildApplicationSelectFields();
  const safeLimit = toSafeLimit(limit, 5);
  const sql = `
    SELECT 
      a.JobID,
      j.JobName,
      j.Location,
      j.JobType,
      j.SalaryFrom,
      j.SalaryTo,
      a.CoverLetter,
      a.upLoadCV,
      ${statusField},
      j.ContractType,
      j.Level,
      j.PostDate,
      j.ExpireDate,
      c.CName AS CompanyName,
      c.Logo AS CompanyLogo,
      c.CompanyID,
      ${appliedDateField}
    FROM apply a
    JOIN job j ON j.JobID = a.JobID
    LEFT JOIN company c ON c.EmployerID = j.EmployerID
    WHERE a.CandidateID = ?
    ORDER BY ${orderField} IS NULL DESC, ${orderField} DESC
    LIMIT ${safeLimit}
  `;
  return executeQuery(sql, [candidateId]);
};

const listCandidateApplications = async (candidateId, limit, offset) => {
  const { statusField, appliedDateField, orderField } = await buildApplicationSelectFields();
  const safeLimit = toSafeLimit(limit, 20);
  const safeOffset = toSafeOffset(offset);
  const sql = `
    SELECT 
      a.JobID,
      j.JobName,
      j.Location,
      j.JobType,
      j.SalaryFrom,
      j.SalaryTo,
      j.ContractType,
      j.Level,
      ${statusField},
      a.CoverLetter,
      a.upLoadCV,
      ${appliedDateField},
      c.CName AS CompanyName,
      c.Logo AS CompanyLogo
    FROM apply a
    JOIN job j ON j.JobID = a.JobID
    LEFT JOIN company c ON c.EmployerID = j.EmployerID
    WHERE a.CandidateID = ?
    ORDER BY ${orderField} IS NULL DESC, ${orderField} DESC
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `;
  return executeQuery(sql, [candidateId]);
};

const countCandidateApplications = async (candidateId) => {
  const rows = await executeQuery('SELECT COUNT(*) AS total FROM apply WHERE CandidateID = ?', [candidateId]);
  return rows[0]?.total || 0;
};

const toSafeLimit = (value, fallback = 20) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const toSafeOffset = (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

module.exports = {
  toPositiveInt,
  ensureCandidateExists,
  addFavourite,
  isJobFavorited,
  isJobApplied,
  addApplication,
  getCandidateProfile,
  getCandidateStats,
  getRecentApplications,
  listCandidateApplications,
  countCandidateApplications,
};

