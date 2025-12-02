const { getPool } = require('../config/db');
const { success } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

async function getStats(req, res, next) {
  try {
    const { employerId } = req.params;
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT 
        e.NumberOfOpenedJob,
        COUNT(DISTINCT f.CandidateID) as totalFollowers,
        COUNT(DISTINCT a.CandidateID) as totalApplications,
        SUM(CASE WHEN j.JobStatus = 'Active' AND j.ExpireDate > CURDATE() THEN 1 ELSE 0 END) as activeJobs,
        SUM(CASE WHEN j.JobStatus = 'Expired' OR j.ExpireDate <= CURDATE() THEN 1 ELSE 0 END) as expiredJobs
      FROM employer e
      LEFT JOIN follow f ON e.ID = f.EmployerID
      LEFT JOIN job j ON e.ID = j.EmployerID
      LEFT JOIN apply a ON j.JobID = a.JobID
      WHERE e.ID = ?
      GROUP BY e.ID`,
      [employerId]
    );

    const data =
      rows[0] || {
        NumberOfOpenedJob: 0,
        totalFollowers: 0,
        totalApplications: 0,
        activeJobs: 0,
        expiredJobs: 0
      };

    return success(res, data, 'Stats retrieved successfully');
  } catch (err) {
    return next(err);
  }
}

async function getEmployerJobs(req, res, next) {
  try {
    const { employerId } = req.params;
    const { status = 'all' } = req.query;
    const { page, limit, offset } = getPagination(req.query, 10);
    const pool = getPool();

    const statusFilter = [];
    let whereStatus = '1=1';
    if (status === 'active') {
      whereStatus =
        "j.JobStatus = 'Active' AND j.ExpireDate > CURDATE()";
    } else if (status === 'expired') {
      whereStatus =
        "(j.JobStatus = 'Expired' OR j.ExpireDate <= CURDATE())";
    }

    const [jobs] = await pool.query(
      `SELECT 
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
        AND (${whereStatus})
      ORDER BY j.PostDate DESC
      LIMIT ? OFFSET ?`,
      [employerId, ...statusFilter, limit, offset]
    );

    const [[{ total } = { total: 0 }]] = await pool.query(
      `SELECT COUNT(*) as total
       FROM job j
       WHERE j.EmployerID = ?
         AND (${whereStatus})`,
      [employerId, ...statusFilter]
    );

    const totalPages = Math.ceil(total / limit) || 1;

    return success(
      res,
      {
        jobs,
        pagination: {
          total,
          page,
          totalPages,
          limit
        }
      },
      'Jobs retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
}

async function getSavedCandidates(req, res, next) {
  try {
    const { employerId } = req.params;
    const { page, limit, offset } = getPagination(req.query, 20);
    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT 
        f.CandidateID,
        u.FName,
        u.LName,
        u.Email,
        u.Phonenume as Phonenumber,
        u.Profile_Picture,
        u.Address,
        p.YearOfExperience,
        p.savedCv
      FROM follow f
      JOIN candidate c ON f.CandidateID = c.ID
      JOIN \`user\` u ON c.ID = u.ID
      LEFT JOIN \`profile\` p ON c.ID = p.CandidateID
      WHERE f.EmployerID = ?
      ORDER BY f.CandidateID DESC
      LIMIT ? OFFSET ?`,
      [employerId, limit, offset]
    );

    const [[{ total } = { total: 0 }]] = await pool.query(
      `SELECT COUNT(*) as total
       FROM follow
       WHERE EmployerID = ?`,
      [employerId]
    );

    const totalPages = Math.ceil(total / limit) || 1;

    return success(
      res,
      {
        candidates: rows,
        pagination: {
          total,
          page,
          totalPages,
          limit
        }
      },
      'Saved candidates retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
}

async function getNotifications(req, res, next) {
  try {
    const { employerId } = req.params;
    const { page, limit, offset } = getPagination(req.query, 10);
    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT 
        nID,
        Title,
        Content,
        Time,
        JobID,
        CandidateID
      FROM notification
      WHERE EmployerID = ?
      ORDER BY Time DESC
      LIMIT ? OFFSET ?`,
      [employerId, limit, offset]
    );

    const [[{ total } = { total: 0 }]] = await pool.query(
      'SELECT COUNT(*) as total FROM notification WHERE EmployerID = ?',
      [employerId]
    );

    const totalPages = Math.ceil(total / limit) || 1;

    return success(
      res,
      {
        notifications: rows,
        pagination: {
          total,
          page,
          totalPages,
          limit
        },
        unreadCount: 0
      },
      'Notifications retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
}

async function getEmployerInfo(req, res, next) {
  try {
    const { employerId } = req.params;
    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT 
        e.ID,
        u.Username,
        u.Email,
        u.FName,
        u.LName,
        u.Phonenume as Phonenumber,
        u.Address,
        u.Profile_Picture,
        e.PackageName,
        e.NumberOfOpenedJob,
        e.purchaseDate,
        p.cost,
        p.desciption,
        p.time
      FROM employer e
      JOIN \`user\` u ON e.ID = u.ID
      LEFT JOIN package p ON e.PackageName = p.PackageName
      WHERE e.ID = ?`,
      [employerId]
    );

    if (!rows[0]) {
      return success(res, null, 'Employer not found', 404);
    }

    const row = rows[0];
    const data = {
      employer: {
        ID: row.ID,
        Username: row.Username,
        Email: row.Email,
        FName: row.FName,
        LName: row.LName,
        Phonenumber: row.Phonenumber,
        Address: row.Address,
        Profile_Picture: row.Profile_Picture,
        PackageName: row.PackageName,
        NumberOfOpenedJob: row.NumberOfOpenedJob,
        purchaseDate: row.purchaseDate
      },
      package: {
        PackageName: row.PackageName,
        cost: row.cost,
        description: row.desciption,
        time: row.time
      }
    };

    return success(res, data, 'Employer profile retrieved successfully');
  } catch (err) {
    return next(err);
  }
}

async function getCompanyInfo(req, res, next) {
  try {
    const { employerId } = req.params;
    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT 
        CompanyID,
        CName,
        CNationality,
        Website,
        Industry,
        CompanySize,
        Logo,
        Description,
        TaxNumber,
        EmployerID
      FROM company
      WHERE EmployerID = ?`,
      [employerId]
    );

    if (!rows[0]) {
      return success(res, null, 'Company not found', 404);
    }

    return success(res, rows[0], 'Company info retrieved successfully');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getStats,
  getEmployerJobs,
  getSavedCandidates,
  getNotifications,
  getEmployerInfo,
  getCompanyInfo
};


