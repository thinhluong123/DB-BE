const { getPool } = require('../config/db');
const { success, fail } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

async function getJobApplications(req, res, next) {
  try {
    const { jobId } = req.params;
    const { status = 'all' } = req.query;
    const { page, limit, offset } = getPagination(req.query, 20);
    const pool = getPool();

    const statusCondition =
      status === 'all' ? '1=1' : 'a.Status_apply = ?';
    const params = status === 'all' ? [jobId, limit, offset] : [jobId, status, limit, offset];

    const [rows] = await pool.query(
      `SELECT 
        a.CandidateID,
        a.JobID,
        a.upLoadCV,
        a.CoverLetter,
        a.Status_apply,
        u.FName,
        u.LName,
        u.Email,
        u.Phonenume as Phonenumber,
        u.Profile_Picture,
        u.Address,
        p.YearOfExperience,
        p.savedCv
      FROM apply a
      JOIN candidate c ON a.CandidateID = c.ID
      JOIN \`user\` u ON c.ID = u.ID
      LEFT JOIN \`profile\` p ON c.ID = p.CandidateID
      WHERE a.JobID = ?
        AND (${statusCondition})
      ORDER BY a.CandidateID DESC
      LIMIT ? OFFSET ?`,
      params
    );

    const countParams = status === 'all' ? [jobId] : [jobId, status];
    const [[{ total } = { total: 0 }]] = await pool.query(
      `SELECT COUNT(*) as total
       FROM apply a
       WHERE a.JobID = ?
         AND (${statusCondition})`,
      countParams
    );

    const totalPages = Math.ceil(total / limit) || 1;

    const statistics = {
      total,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    return success(
      res,
      {
        applications: rows,
        pagination: {
          total,
          page,
          totalPages,
          limit
        },
        statistics
      },
      'Applications retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
}

async function updateApplicationStatus(req, res, next) {
  try {
    const { jobId, candidateId } = req.params;
    const { Status_apply } = req.body;

    if (!Status_apply) {
      return fail(res, 'Status_apply is required', 400);
    }

    const pool = getPool();
    const [result] = await pool.query(
      'UPDATE apply SET Status_apply = ? WHERE JobID = ? AND CandidateID = ?',
      [Status_apply, jobId, candidateId]
    );

    if (result.affectedRows === 0) {
      return fail(res, 'Application not found', 404);
    }

    return success(
      res,
      {
        JobID: Number(jobId),
        CandidateID: Number(candidateId),
        Status_apply
      },
      'Application status updated successfully'
    );
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getJobApplications,
  updateApplicationStatus
};


