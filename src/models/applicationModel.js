const createHttpError = require('http-errors');
const { executeQuery } = require('../config/database');

let cachedColumnInfo = null;

const detectApplicationColumns = async () => {
  if (cachedColumnInfo) return cachedColumnInfo;
  const [statusRows, appliedDateRows] = await Promise.all([
    executeQuery("SHOW COLUMNS FROM apply LIKE 'Status_apply'"),
    executeQuery("SHOW COLUMNS FROM apply LIKE 'AppliedDate'"),
  ]);

  cachedColumnInfo = {
    hasStatus: statusRows.length > 0,
    hasAppliedDate: appliedDateRows.length > 0,
  };
  return cachedColumnInfo;
};

const normalizeLimit = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const normalizeOffset = (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

const buildStatusCondition = (status, hasStatusColumn) => {
  if (!hasStatusColumn) return { clause: '', params: [] };
  if (!status || status === 'all') {
    return { clause: '', params: [] };
  }
  return {
    clause: 'AND a.Status_apply = ?',
    params: [status],
  };
};

const getJobApplications = async (jobId, statusFilter, limit = 20, offset = 0) => {
  const { hasStatus, hasAppliedDate } = await detectApplicationColumns();

  const selectStatus = hasStatus ? 'a.Status_apply' : "NULL AS Status_apply";
  const selectAppliedDate = hasAppliedDate ? 'a.AppliedDate' : "NULL AS AppliedDate";

  const statusCondition = buildStatusCondition(statusFilter, hasStatus);
  const safeLimit = normalizeLimit(limit, 20);
  const safeOffset = normalizeOffset(offset);

  const sql = `
    SELECT 
      a.CandidateID,
      a.JobID,
      a.upLoadCV,
      a.CoverLetter,
      ${selectStatus},
      ${selectAppliedDate},
      u.FName,
      u.LName,
      u.Email,
      u.Phonenumber AS Phonenumber,
      u.Profile_Picture,
      u.Address,
      p.YearOfExperience,
      p.savedCv
    FROM apply a
    JOIN candidate c ON a.CandidateID = c.ID
    JOIN user u ON c.ID = u.ID
    LEFT JOIN profile p ON p.CandidateID = c.ID
    WHERE a.JobID = ?
    ${statusCondition.clause}
    ORDER BY a.CandidateID DESC
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `;

  const rows = await executeQuery(sql, [jobId, ...statusCondition.params]);
  return rows;
};

const countJobApplications = async (jobId, statusFilter) => {
  const { hasStatus } = await detectApplicationColumns();
  const statusCondition = buildStatusCondition(statusFilter, hasStatus);
  const rows = await executeQuery(
    `
      SELECT COUNT(*) AS total
      FROM apply a
      WHERE a.JobID = ?
      ${statusCondition.clause}
    `,
    [jobId, ...statusCondition.params],
  );
  return rows[0]?.total || 0;
};

const getApplicationStatistics = async (jobId) => {
  const { hasStatus } = await detectApplicationColumns();
  if (!hasStatus) {
    const rows = await executeQuery('SELECT COUNT(*) AS total FROM apply WHERE JobID = ?', [jobId]);
    const total = rows[0]?.total || 0;
    return {
      total,
      pending: total,
      approved: 0,
      rejected: 0,
    };
  }

  const rows = await executeQuery(
    `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN a.Status_apply IN ('Dang duyet', 'Pending') THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN a.Status_apply IN ('Duyet', 'Approved') THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN a.Status_apply IN ('Tu choi', 'Rejected') THEN 1 ELSE 0 END) AS rejected
    FROM apply a
    WHERE a.JobID = ?
  `,
    [jobId],
  );

  const stats = rows[0] || {};
  return {
    total: stats.total || 0,
    pending: stats.pending || 0,
    approved: stats.approved || 0,
    rejected: stats.rejected || 0,
  };
};

const countNewApplicationsToday = async (employerId) => {
  const { hasAppliedDate } = await detectApplicationColumns();
  if (!hasAppliedDate) return 0;

  const rows = await executeQuery(
    `
      SELECT COUNT(*) AS total
      FROM apply a
      JOIN job j ON j.JobID = a.JobID
      WHERE j.EmployerID = ?
        AND DATE(a.AppliedDate) = CURDATE()
    `,
    [employerId],
  );
  return rows[0]?.total || 0;
};

const updateApplicationStatus = async (jobId, candidateId, status) => {
  const { hasStatus } = await detectApplicationColumns();
  if (!hasStatus) {
    throw createHttpError(400, 'Status_apply column does not exist in apply table');
  }

  const result = await executeQuery(
    `
    UPDATE apply
    SET Status_apply = ?
    WHERE JobID = ? AND CandidateID = ?
  `,
    [status, jobId, candidateId],
  );
  return result.affectedRows || 0;
};

module.exports = {
  detectApplicationColumns,
  getJobApplications,
  countJobApplications,
  getApplicationStatistics,
  countNewApplicationsToday,
  updateApplicationStatus,
};

