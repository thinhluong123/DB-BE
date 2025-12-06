const createHttpError = require('http-errors');
const { executeQuery } = require('../config/database');

const SORTING_MAP = {
  latest: 'j.PostDate DESC',
  oldest: 'j.PostDate ASC',
  salary_desc: 'j.SalaryTo DESC',
  salary_asc: 'j.SalaryFrom ASC',
  popular: 'j.NumberOfApplicant DESC',
};

// Helper function để normalize array từ query params
const normalizeArray = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    // Hỗ trợ cả comma-separated string
    return value.split(',').map(item => item.trim()).filter(item => item);
  }
  return [value];
};

const buildJobFilters = (filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.status === 'active') {
    conditions.push("(j.JobStatus IN ('OPEN', 'Active') AND j.ExpireDate >= CURDATE())");
  } else if (filters.status === 'expired') {
    conditions.push("(j.JobStatus IN ('Expired', 'CLOSED') OR j.ExpireDate < CURDATE())");
  }

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(j.JobName LIKE ? OR comp.CName LIKE ? OR comp.Industry LIKE ?)');
    params.push(keyword, keyword, keyword);
  }

  if (filters.location) {
    conditions.push('j.Location LIKE ?');
    params.push(`%${filters.location}%`);
  }

  // Hỗ trợ multiple jobType (array hoặc comma-separated)
  const jobTypes = normalizeArray(filters.jobType);
  if (jobTypes && jobTypes.length > 0) {
    const placeholders = jobTypes.map(() => '?').join(',');
    conditions.push(`j.JobType IN (${placeholders})`);
    params.push(...jobTypes);
  }

  // Hỗ trợ multiple contractType (array hoặc comma-separated)
  const contractTypes = normalizeArray(filters.contractType);
  if (contractTypes && contractTypes.length > 0) {
    const placeholders = contractTypes.map(() => '?').join(',');
    conditions.push(`j.ContractType IN (${placeholders})`);
    params.push(...contractTypes);
  }

  // Hỗ trợ multiple level (array hoặc comma-separated)
  const levels = normalizeArray(filters.level);
  if (levels && levels.length > 0) {
    const placeholders = levels.map(() => '?').join(',');
    conditions.push(`j.Level IN (${placeholders})`);
    params.push(...levels);
  }

  // Hỗ trợ salary range filter
  if (filters.salaryMin !== undefined && filters.salaryMin !== null) {
    const salaryMin = parseInt(filters.salaryMin, 10);
    if (!Number.isNaN(salaryMin) && salaryMin > 0) {
      // Job hiển thị nếu SalaryTo >= salaryMin (có giao nhau với khoảng filter)
      conditions.push('j.SalaryTo >= ?');
      params.push(salaryMin);
    }
  }

  if (filters.salaryMax !== undefined && filters.salaryMax !== null) {
    const salaryMax = parseInt(filters.salaryMax, 10);
    if (!Number.isNaN(salaryMax) && salaryMax > 0) {
      // Job hiển thị nếu SalaryFrom <= salaryMax (có giao nhau với khoảng filter)
      conditions.push('j.SalaryFrom <= ?');
      params.push(salaryMax);
    }
  }

  if (filters.employerId) {
    conditions.push('j.EmployerID = ?');
    params.push(filters.employerId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
};

const resolveSorting = (sortBy) => SORTING_MAP[sortBy] || SORTING_MAP.latest;

const toSafeInteger = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

const fetchJobs = async (filters, limit, offset, sortBy) => {
  const safeLimit = toSafeInteger(limit, 10) || 10;
  const safeOffset = toSafeInteger(offset, 0);
  const { whereClause, params } = buildJobFilters(filters);
  const sql = `
    SELECT
      j.JobID,
      j.JobName,
      j.JobType,
      j.ContractType,
      j.Level,
      j.Location,
      j.SalaryFrom,
      j.SalaryTo,
      j.RequiredExpYear,
      j.Quantity,
      j.PostDate,
      j.ExpireDate,
      j.JobStatus,
      j.NumberOfApplicant,
      COALESCE(comp.CName, 'Unknown Company') AS CompanyName,
      comp.Logo AS CompanyLogo
    FROM job j
    LEFT JOIN company comp ON comp.EmployerID = j.EmployerID
    ${whereClause}
    ORDER BY ${resolveSorting(sortBy)}
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `;
  return executeQuery(sql, params);
};

const countJobs = async (filters) => {
  const { whereClause, params } = buildJobFilters(filters);
  const sql = `
    SELECT COUNT(*) AS total
    FROM job j
    LEFT JOIN company comp ON comp.EmployerID = j.EmployerID
    ${whereClause}
  `;
  const rows = await executeQuery(sql, params);
  return rows[0]?.total || 0;
};

const fetchJobById = async (jobId) => {
  if (!jobId) throw createHttpError(400, 'JobID is required');
  const sql = `
    SELECT
      j.*,
      comp.CompanyID,
      comp.CName AS CompanyName,
      comp.Logo,
      comp.CompanySize,
      comp.Website,
      comp.Description,
      comp.Industry,
      comp.CNationality,
      comp.TaxNumber,
      usr.Address AS CompanyAddress
    FROM job j
    LEFT JOIN employer e ON e.ID = j.EmployerID
    LEFT JOIN company comp ON comp.EmployerID = e.ID
    LEFT JOIN user usr ON usr.ID = e.ID
    WHERE j.JobID = ?
  `;
  const rows = await executeQuery(sql, [jobId]);
  return rows[0];
};

const fetchJobCategories = (jobId) =>
  executeQuery(
    `
    SELECT jc.JCName, jc.Specialty
    FROM \`in\` ji
    JOIN job_category jc ON ji.JCName = jc.JCName
    WHERE ji.JobID = ?
  `,
    [jobId],
  );

const fetchJobSkills = (jobId) =>
  executeQuery(
    `
    SELECT s.SkillName, s.Description
    FROM \`require\` r
    JOIN skill s ON r.SkillName = s.SkillName
    WHERE r.JobID = ?
  `,
    [jobId],
  );

let hasStatusApplyColumn = null;

const ensureStatusApplyColumn = async () => {
  if (hasStatusApplyColumn !== null) return hasStatusApplyColumn;
  const rows = await executeQuery("SHOW COLUMNS FROM apply LIKE 'Status_apply'");
  hasStatusApplyColumn = rows.length > 0;
  return hasStatusApplyColumn;
};

const fetchJobApplicationStats = async (jobId) => {
  const hasColumn = await ensureStatusApplyColumn();
  if (!hasColumn) {
    const rows = await executeQuery('SELECT COUNT(*) AS total FROM apply WHERE JobID = ?', [jobId]);
    const total = rows[0]?.total || 0;
    return { total, approved: 0, declined: 0 };
  }

  const statsRows = await executeQuery(
    `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN Status_apply IN ('Duyet', 'Approved') THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN Status_apply IN ('Tu choi', 'Declined') THEN 1 ELSE 0 END) AS declined
    FROM apply
    WHERE JobID = ?
  `,
    [jobId],
  );
  const stats = statsRows[0] || {};
  return {
    total: stats.total || 0,
    approved: stats.approved || 0,
    declined: stats.declined || 0,
  };
};

module.exports = {
  fetchJobs,
  countJobs,
  fetchJobById,
  fetchJobCategories,
  fetchJobSkills,
  fetchJobApplicationStats,
};

