const { getPool } = require('../config/db');
const { success, fail } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

// PUBLIC JOB LIST: GET /api/jobs
async function listJobs(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query, 12);
    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT 
        j.JobID,
        j.JobName,
        j.Location,
        j.ContractType,
        j.JobType,
        j.Level,
        j.SalaryFrom,
        j.SalaryTo,
        j.RequiredExpYear,
        j.PostDate,
        j.ExpireDate,
        j.NumberOfApplicant,
        j.JobStatus,
        c.CName as CompanyName,
        c.Logo as CompanyLogo
      FROM job j
      LEFT JOIN employer e ON j.EmployerID = e.ID
      LEFT JOIN company c ON e.ID = c.EmployerID
      WHERE j.JobStatus = 'Active' AND j.ExpireDate > CURDATE()
      ORDER BY j.PostDate DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total } = { total: 0 }]] = await pool.query(
      "SELECT COUNT(*) as total FROM job WHERE JobStatus = 'Active' AND ExpireDate > CURDATE()"
    );

    const totalPages = Math.ceil(total / limit) || 1;

    return success(
      res,
      {
        jobs: rows,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_jobs: total,
          per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      },
      'Jobs retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
}

// PUBLIC JOB DETAIL: GET /api/jobs/:jobId
async function getJobDetail(req, res, next) {
  try {
    const { jobId } = req.params;
    const pool = getPool();

    const [jobs] = await pool.query(
      `SELECT 
        j.*,
        c.CompanyID,
        c.CName as CompanyName,
        c.TaxNumber,
        c.Industry,
        c.CompanySize,
        c.Website,
        c.CNationality as Nationality,
        c.Logo,
        c.Description
      FROM job j
      LEFT JOIN employer e ON j.EmployerID = e.ID
      LEFT JOIN company c ON e.ID = c.EmployerID
      WHERE j.JobID = ?`,
      [jobId]
    );

    if (!jobs[0]) {
      return fail(res, 'Job not found', 404);
    }

    const job = jobs[0];

    const [categories] = await pool.query(
      `SELECT jc.JCName, jc.Specialty as Speciality
       FROM \`in\` i
       JOIN job_category jc ON i.JCName = jc.JCName
       WHERE i.JobID = ?`,
      [jobId]
    );

    const [skills] = await pool.query(
      `SELECT s.SkillName, s.Description
       FROM \`require\` r
       JOIN skill s ON r.SkillName = s.SkillName
       WHERE r.JobID = ?`,
      [jobId]
    );

    const data = {
      JobID: job.JobID,
      JobName: job.JobName,
      JD: job.JD,
      Location: job.Location,
      salaryFrom: job.SalaryFrom,
      salaryTo: job.SalaryTo,
      Salary: `${job.SalaryFrom} - ${job.SalaryTo}`,
      Quantity: job.Quantity,
      RequireExpYear: job.RequiredExpYear,
      Level: job.Level,
      ContractType: job.ContractType,
      JobType: job.JobType,
      JobStatus: job.JobStatus,
      postDate: job.PostDate,
      expireDate: job.ExpireDate,
      NumberOfApplicant: job.NumberOfApplicant,
      statistics: [],
      Views: 0,
      featured: false,
      urgent: false,
      company: {
        CompanyID: job.CompanyID,
        CompanyName: job.CompanyName,
        TaxNumber: job.TaxNumber,
        Industry: job.Industry,
        CompanySize: job.CompanySize,
        Website: job.Website,
        Nationality: job.Nationality,
        Logo: job.Logo,
        Description: job.Description,
        Address: null
      },
      categories,
      requiredSkills: skills.map((s) => ({
        SkillName: s.SkillName,
        RequiredLevel: null,
        IsRequired: true,
        Description: s.Description
      }))
    };

    return success(res, data, 'Job details retrieved successfully');
  } catch (err) {
    return next(err);
  }
}

// Candidate: POST /api/jobs/:jobId/apply
async function applyForJob(req, res, next) {
  try {
    const candidateId = req.user.id;
    const { jobId } = req.params;
    const { CoverLetter, uploadCV } = req.body;

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Check tồn tại
      const [[existing]] = await conn.query(
        'SELECT 1 FROM apply WHERE CandidateID = ? AND JobID = ?',
        [candidateId, jobId]
      );
      if (existing) {
        await conn.rollback();
        return fail(res, 'Bạn đã ứng tuyển công việc này rồi', 400);
      }

      await conn.query(
        `INSERT INTO apply (CandidateID, JobID, upLoadCV, CoverLetter, Status_apply)
         VALUES (?, ?, ?, ?, 'Dang duyet')`,
        [candidateId, jobId, uploadCV || null, CoverLetter || null]
      );

      await conn.query(
        'UPDATE job SET NumberOfApplicant = NumberOfApplicant + 1 WHERE JobID = ?',
        [jobId]
      );

      await conn.commit();

      return success(
        res,
        {
          JobID: Number(jobId),
          CandidateID: candidateId,
          Status: 'submitted'
        },
        'Đơn ứng tuyển đã được gửi thành công',
        201
      );
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return next(err);
  }
}

// Candidate: POST /api/jobs/:jobId/favorite
async function toggleFavorite(req, res, next) {
  try {
    const candidateId = req.user.id;
    const { jobId } = req.params;
    const pool = getPool();

    // Kiểm tra đã favourite chưa
    const [[row]] = await pool.query(
      'SELECT 1 FROM favourite WHERE CandidateID = ? AND JobID = ?',
      [candidateId, jobId]
    );

    if (row) {
      await pool.query('DELETE FROM favourite WHERE CandidateID = ? AND JobID = ?', [
        candidateId,
        jobId
      ]);
      return success(
        res,
        { JobID: Number(jobId), favorited: false },
        'Job removed from favorites successfully'
      );
    }

    await pool.query(
      'INSERT INTO favourite (CandidateID, JobID, Date) VALUES (?, ?, CURDATE())',
      [candidateId, jobId]
    );
    return success(
      res,
      { JobID: Number(jobId), favorited: true },
      'Job added to favorites successfully',
      201
    );
  } catch (err) {
    return next(err);
  }
}

// Candidate: GET /api/jobs/:jobId/check-status
async function checkJobStatus(req, res, next) {
  try {
    const candidateId = req.user.id;
    const { jobId } = req.params;
    const pool = getPool();

    const [[fav]] = await pool.query(
      'SELECT 1 FROM favourite WHERE CandidateID = ? AND JobID = ?',
      [candidateId, jobId]
    );
    const [[app]] = await pool.query(
      'SELECT 1 FROM apply WHERE CandidateID = ? AND JobID = ?',
      [candidateId, jobId]
    );
    const [[job]] = await pool.query('SELECT ExpireDate FROM job WHERE JobID = ?', [jobId]);

    const favorited = !!fav;
    const applied = !!app;
    const applicationDeadline = job ? job.ExpireDate : null;

    return success(
      res,
      {
        JobID: Number(jobId),
        favorited,
        applied,
        canApply: !applied,
        applicationDeadline
      },
      'Job status retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
}

async function createJob(req, res, next) {
  try {
    const {
      JobName,
      JD,
      JobType,
      ContractType,
      Level,
      Quantity,
      SalaryFrom,
      SalaryTo,
      RequiredExpYear,
      Location,
      PostDate,
      ExpireDate,
      JobStatus,
      EmployerID,
      categories = [],
      skills = []
    } = req.body;

    if (
      !JobName ||
      !JD ||
      !JobType ||
      !ContractType ||
      !Level ||
      !Quantity ||
      !SalaryFrom ||
      !SalaryTo ||
      !RequiredExpYear ||
      !Location ||
      !EmployerID
    ) {
      return fail(res, 'Thiếu thông tin bắt buộc của job', 400);
    }

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO job (
          JobName, JD, JobType, ContractType, Level, Quantity,
          SalaryFrom, SalaryTo, RequiredExpYear, Location,
          PostDate, ExpireDate, JobStatus, EmployerID,
          NumberOfApplicant
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          JobName,
          JD,
          JobType,
          ContractType,
          Level,
          Quantity,
          SalaryFrom,
          SalaryTo,
          RequiredExpYear,
          Location,
          PostDate,
          ExpireDate,
          JobStatus || 'Active',
          EmployerID
        ]
      );

      const jobId = result.insertId;

      // categories -> bảng `in`
      if (Array.isArray(categories) && categories.length) {
        const values = categories.map((name) => [jobId, name]);
        await conn.query('INSERT INTO `in` (JobID, JCName) VALUES ?', [values]);
      }

      // skills -> bảng `require`
      if (Array.isArray(skills) && skills.length) {
        const values = skills.map((name) => [jobId, name]);
        await conn.query('INSERT INTO `require` (JobID, SkillName) VALUES ?', [values]);
      }

      await conn.query(
        'UPDATE employer SET NumberOfOpenedJob = NumberOfOpenedJob + 1 WHERE ID = ?',
        [EmployerID]
      );

      await conn.commit();

      return success(
        res,
        {
          JobID: jobId,
          JobName,
          JobStatus: JobStatus || 'Active',
          PostDate
        },
        'Job posted successfully',
        201
      );
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return next(err);
  }
}

async function updateJobStatus(req, res, next) {
  try {
    const { jobId } = req.params;
    const { JobStatus } = req.body;

    if (!JobStatus) {
      return fail(res, 'JobStatus is required', 400);
    }

    const pool = getPool();
    const [result] = await pool.query(
      `UPDATE job 
       SET JobStatus = ?, 
           ExpireDate = CASE WHEN ? = 'Expired' THEN CURDATE() ELSE ExpireDate END
       WHERE JobID = ?`,
      [JobStatus, JobStatus, jobId]
    );

    if (result.affectedRows === 0) {
      return fail(res, 'Job not found', 404);
    }

    return success(
      res,
      {
        JobID: Number(jobId),
        JobStatus
      },
      'Job status updated successfully'
    );
  } catch (err) {
    return next(err);
  }
}

async function deleteJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [[job]] = await conn.query('SELECT EmployerID FROM job WHERE JobID = ?', [jobId]);
      if (!job) {
        await conn.rollback();
        return fail(res, 'Job not found', 404);
      }

      await conn.query('DELETE FROM job WHERE JobID = ?', [jobId]);
      await conn.query(
        'UPDATE employer SET NumberOfOpenedJob = NumberOfOpenedJob - 1 WHERE ID = ?',
        [job.EmployerID]
      );

      await conn.commit();
      return success(res, null, 'Job deleted successfully');
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return next(err);
  }
}

async function followCandidate(req, res, next) {
  try {
    const { employerId, candidateId } = req.params;
    const pool = getPool();
    await pool.query('INSERT IGNORE INTO follow (EmployerID, CandidateID) VALUES (?, ?)', [
      employerId,
      candidateId
    ]);

    return success(
      res,
      {
        EmployerID: Number(employerId),
        CandidateID: Number(candidateId)
      },
      'Candidate followed successfully',
      201
    );
  } catch (err) {
    return next(err);
  }
}

async function unfollowCandidate(req, res, next) {
  try {
    const { employerId, candidateId } = req.params;
    const pool = getPool();
    await pool.query('DELETE FROM follow WHERE EmployerID = ? AND CandidateID = ?', [
      employerId,
      candidateId
    ]);

    return success(res, null, 'Candidate unfollowed successfully');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listJobs,
  getJobDetail,
  createJob,
  updateJobStatus,
  deleteJob,
  followCandidate,
  unfollowCandidate,
  applyForJob,
  toggleFavorite,
  checkJobStatus
};


