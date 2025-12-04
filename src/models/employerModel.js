const createHttpError = require('http-errors');
const { executeQuery, getConnection } = require('../config/database');

const sanitizePositiveInteger = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const sanitizeNonNegativeInteger = (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

const getDashboardStats = async (employerId) => {
  const rows = await executeQuery(
    `
    SELECT 
      e.NumberOfOpenedJob,
      COUNT(DISTINCT f.CandidateID) AS totalFollowers,
      COUNT(DISTINCT a.CandidateID) AS totalApplications,
      SUM(CASE WHEN j.JobStatus IN ('Active', 'OPEN') AND j.ExpireDate > CURDATE() THEN 1 ELSE 0 END) AS activeJobs,
      SUM(CASE WHEN j.JobStatus IN ('Expired', 'CLOSED') OR j.ExpireDate <= CURDATE() THEN 1 ELSE 0 END) AS expiredJobs
    FROM employer e
    LEFT JOIN follow f ON e.ID = f.EmployerID
    LEFT JOIN job j ON e.ID = j.EmployerID
    LEFT JOIN apply a ON j.JobID = a.JobID
    WHERE e.ID = ?
    GROUP BY e.ID
  `,
    [employerId],
  );
  return rows[0];
};

const buildEmployerJobFilter = (statusFilter) => {
  if (statusFilter === 'active') {
    return "AND (j.JobStatus IN ('Active', 'OPEN') AND j.ExpireDate > CURDATE())";
  }
  if (statusFilter === 'expired') {
    return "AND (j.JobStatus IN ('Expired', 'CLOSED') OR j.ExpireDate <= CURDATE())";
  }
  return '';
};

const getEmployerJobs = async (employerId, statusFilter = 'all', page = 1, limit = 10) => {
  const safeLimit = sanitizePositiveInteger(limit, 10);
  const safePage = sanitizePositiveInteger(page, 1);
  const offset = (safePage - 1) * safeLimit;
  const statusClause = buildEmployerJobFilter(statusFilter);

  const jobs = await executeQuery(
    `
    SELECT 
      j.JobID,
      j.JobName,
      j.JobType,
      j.ContractType,
      j.Level,
      j.PostDate,
      j.ExpireDate,
      j.JobStatus,
      j.NumberOfApplicant,
      j.Location,
      j.SalaryFrom,
      j.SalaryTo,
      j.Quantity,
      j.RequiredExpYear
    FROM job j
    WHERE j.EmployerID = ?
    ${statusClause}
    ORDER BY j.PostDate DESC
    LIMIT ${safeLimit} OFFSET ${offset}
  `,
    [employerId],
  );

  const totalRows = await executeQuery(
    `
    SELECT COUNT(*) AS total
    FROM job j
    WHERE j.EmployerID = ?
    ${statusClause}
  `,
    [employerId],
  );

  return {
    jobs,
    total: totalRows[0]?.total || 0,
  };
};

const getSavedCandidates = async (employerId, page = 1, limit = 20) => {
  const safeLimit = sanitizePositiveInteger(limit, 20);
  const safePage = sanitizePositiveInteger(page, 1);
  const offset = (safePage - 1) * safeLimit;

  const candidates = await executeQuery(
    `
    SELECT 
      f.CandidateID,
      u.FName,
      u.LName,
      u.Email,
      u.Phonenumber AS Phonenumber,
      u.Profile_Picture,
      u.Address,
      p.YearOfExperience,
      p.savedCv
    FROM follow f
    JOIN candidate c ON f.CandidateID = c.ID
    JOIN user u ON c.ID = u.ID
    LEFT JOIN profile p ON p.CandidateID = c.ID
    WHERE f.EmployerID = ?
    ORDER BY f.CandidateID DESC
    LIMIT ${safeLimit} OFFSET ${offset}
  `,
    [employerId],
  );

  const totalRows = await executeQuery(
    `
    SELECT COUNT(*) AS total
    FROM follow
    WHERE EmployerID = ?
  `,
    [employerId],
  );

  return {
    candidates,
    total: totalRows[0]?.total || 0,
  };
};

const getNotifications = async (employerId, page = 1, limit = 10) => {
  const safeLimit = sanitizePositiveInteger(limit, 10);
  const safePage = sanitizePositiveInteger(page, 1);
  const offset = (safePage - 1) * safeLimit;

  const notifications = await executeQuery(
    `
    SELECT 
      nID,
      Title,
      Content,
      \`Time\`,
      JobID,
      CandidateID
    FROM notification
    WHERE EmployerID = ?
    ORDER BY \`Time\` DESC
    LIMIT ${safeLimit} OFFSET ${offset}
  `,
    [employerId],
  );

  const totalRows = await executeQuery(
    `
    SELECT COUNT(*) AS total
    FROM notification
    WHERE EmployerID = ?
  `,
    [employerId],
  );

  return {
    notifications,
    total: totalRows[0]?.total || 0,
  };
};

const getEmployerProfile = async (employerId) => {
  const rows = await executeQuery(
    `
    SELECT 
      e.ID,
      u.Username,
      u.Email,
      u.FName,
      u.LName,
      u.Phonenumber AS Phonenumber,
      u.Address,
      u.Profile_Picture,
      e.NumberOfOpenedJob,
      pur.PackageName,
      p.cost,
      p.desciption,
      p.time,
      pur.purchaseDate
    FROM employer e
    JOIN user u ON e.ID = u.ID
    LEFT JOIN (
      SELECT EmpID, PackageName, purchaseDate
      FROM purchase
      WHERE EmpID = ?
      ORDER BY purchaseDate DESC
      LIMIT 1
    ) pur ON pur.EmpID = e.ID
    LEFT JOIN package p ON pur.PackageName = p.PackageName
    WHERE e.ID = ?
  `,
    [employerId, employerId],
  );
  return rows[0];
};

const getEmployerCompany = async (employerId) => {
  const rows = await executeQuery(
    `
    SELECT 
      CompanyID,
      CName,
      CNationality,
      Website,
      Industry,
      CompanySize,
      Logo,
      \`Description\`,
      TaxNumber,
      EmployerID
    FROM company
    WHERE EmployerID = ?
  `,
    [employerId],
  );
  return rows[0];
};

const adjustEmployerOpenedJobs = async (employerId, delta) => {
  await executeQuery(
    `
    UPDATE employer
    SET NumberOfOpenedJob = GREATEST(NumberOfOpenedJob + ?, 0)
    WHERE ID = ?
  `,
    [delta, employerId],
  );
};

const followCandidate = async (employerId, candidateId) => {
  await executeQuery(
    `
    INSERT INTO follow (EmployerID, CandidateID)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE CandidateID = CandidateID
  `,
    [employerId, candidateId],
  );
};

const unfollowCandidate = async (employerId, candidateId) => {
  const result = await executeQuery(
    `
    DELETE FROM follow
    WHERE EmployerID = ? AND CandidateID = ?
  `,
    [employerId, candidateId],
  );
  return result.affectedRows || 0;
};

const deleteJobById = async (jobId) => {
  const result = await executeQuery('DELETE FROM job WHERE JobID = ?', [jobId]);
  return result.affectedRows || 0;
};

const createJobRecord = async (payload) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const [nextRows] = await connection.query('SELECT IFNULL(MAX(JobID), 0) + 1 AS nextId FROM job');
    const jobId = nextRows[0]?.nextId || 1;

    const insertSql = `
      INSERT INTO job (
        JobID,
        JobName,
        JD,
        JobType,
        ContractType,
        \`Level\`,
        Quantity,
        SalaryFrom,
        SalaryTo,
        RequiredExpYear,
        Location,
        PostDate,
        ExpireDate,
        JobStatus,
        EmployerID,
        NumberOfApplicant
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    await connection.execute(insertSql, [
      jobId,
      payload.JobName,
      payload.JD,
      payload.JobType,
      payload.ContractType,
      payload.Level,
      payload.Quantity,
      payload.SalaryFrom,
      payload.SalaryTo,
      payload.RequiredExpYear,
      payload.Location,
      payload.PostDate,
      payload.ExpireDate,
      payload.JobStatus,
      payload.EmployerID,
    ]);

    if (Array.isArray(payload.categories) && payload.categories.length) {
      const categorySql = 'INSERT INTO `in` (JobID, JCName) VALUES (?, ?)';
      // eslint-disable-next-line no-restricted-syntax
      for (const category of payload.categories) {
        // eslint-disable-next-line no-await-in-loop
        await connection.execute(categorySql, [jobId, category]);
      }
    }

    if (Array.isArray(payload.skills) && payload.skills.length) {
      const skillSql = 'INSERT INTO `require` (JobID, SkillName) VALUES (?, ?)';
      // eslint-disable-next-line no-restricted-syntax
      for (const skill of payload.skills) {
        // eslint-disable-next-line no-await-in-loop
        await connection.execute(skillSql, [jobId, skill]);
      }
    }

    await connection.commit();
    return jobId;
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw createHttpError(400, 'Invalid category or skill reference');
    }
    throw error;
  } finally {
    connection.release();
  }
};

const updateJobStatus = async (jobId, status) => {
  const result = await executeQuery(
    `
    UPDATE job 
    SET JobStatus = ?, 
        ExpireDate = CASE WHEN ? IN ('Expired', 'CLOSED') THEN CURDATE() ELSE ExpireDate END
    WHERE JobID = ?
  `,
    [status, status, jobId],
  );
  return result.affectedRows || 0;
};

const createEmployer = async (userId) =>
  executeQuery('INSERT INTO employer (ID) VALUES (?)', [userId]);

module.exports = {
  getDashboardStats,
  getEmployerJobs,
  getSavedCandidates,
  getNotifications,
  getEmployerProfile,
  getEmployerCompany,
  adjustEmployerOpenedJobs,
  followCandidate,
  unfollowCandidate,
  deleteJobById,
  createJobRecord,
  updateJobStatus,
  createEmployer,
};

