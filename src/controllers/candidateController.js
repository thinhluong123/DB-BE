const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const { success, fail } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

// 9. GET /api/candidate/dashboard
async function getDashboard(req, res, next) {
  try {
    const candidateId = req.user.id;
    const pool = getPool();

    const [[user]] = await pool.query(
      `SELECT 
        u.FName,
        u.LName,
        u.Profile_Picture as avatar,
        u.Address as location,
        u.Email,
        u.Phonenume as phone
      FROM \`user\` u
      JOIN candidate c ON u.ID = c.ID
      WHERE c.ID = ?`,
      [candidateId]
    );

    const [[appliedRow]] = await pool.query(
      'SELECT COUNT(*) AS appliedJobs FROM apply WHERE CandidateID = ?',
      [candidateId]
    );
    const [[favRow]] = await pool.query(
      'SELECT COUNT(*) AS favoriteJobs FROM favourite WHERE CandidateID = ?',
      [candidateId]
    );

    const [recentApplications] = await pool.query(
      `SELECT 
        a.JobID,
        j.JobName as title,
        c2.CName as company,
        c2.Logo as logo,
        j.Location as location,
        CONCAT(j.SalaryFrom, ' - ', j.SalaryTo) as salary,
        j.JobType as type,
        a.CandidateID,
        a.JobID,
        a.Status_apply as status,
        a.CoverLetter,
        a.upLoadCV,
        a.CreatedAt as appliedAt
      FROM apply a
      JOIN job j ON a.JobID = j.JobID
      LEFT JOIN employer e ON j.EmployerID = e.ID
      LEFT JOIN company c2 ON e.ID = c2.EmployerID
      WHERE a.CandidateID = ?
      ORDER BY a.CreatedAt DESC
      LIMIT 5`,
      [candidateId]
    );

    const data = {
      user: {
        name: `${user.FName} ${user.LName}`,
        avatar: user.avatar,
        profileCompletion: 0
      },
      stats: {
        appliedJobs: appliedRow.appliedJobs,
        favoriteJobs: favRow.favoriteJobs,
        jobAlerts: 0
      },
      recentApplications
    };

    return success(res, data, 'Candidate dashboard retrieved successfully');
  } catch (err) {
    return next(err);
  }
}

// 11. GET /api/candidate/applications
async function getApplications(req, res, next) {
  try {
    const candidateId = req.user.id;
    const { page, limit, offset } = getPagination(req.query, 20);
    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT 
        a.JobID,
        j.JobName as title,
        c2.CName as company,
        c2.Logo as logo,
        j.Location as location,
        CONCAT(j.SalaryFrom, ' - ', j.SalaryTo) as salary,
        j.JobType as type,
        a.Status_apply as status,
        a.CreatedAt as appliedAt
      FROM apply a
      JOIN job j ON a.JobID = j.JobID
      LEFT JOIN employer e ON j.EmployerID = e.ID
      LEFT JOIN company c2 ON e.ID = c2.EmployerID
      WHERE a.CandidateID = ?
      ORDER BY a.CreatedAt DESC
      LIMIT ? OFFSET ?`,
      [candidateId, limit, offset]
    );

    const [[{ total } = { total: 0 }]] = await pool.query(
      'SELECT COUNT(*) as total FROM apply WHERE CandidateID = ?',
      [candidateId]
    );

    const totalPages = Math.ceil(total / limit) || 1;

    return success(
      res,
      {
        applications: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      },
      'Applications retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
}

// PROFILE APIs (api_need for profile.md)

async function getProfile(req, res, next) {
  try {
    const candidateId = req.user.id;
    const pool = getPool();

    const [[user]] = await pool.query(
      `SELECT 
        u.FName,
        u.LName,
        u.Profile_Picture as avatar,
        u.Address as location,
        u.Email,
        u.Phonenume as phone,
        u.Bdate as dateOfBirth
      FROM \`user\` u
      JOIN candidate c ON u.ID = c.ID
      WHERE c.ID = ?`,
      [candidateId]
    );

    const [[profile]] = await pool.query(
      `SELECT 
        savedCv,
        YearOfExperience
      FROM \`profile\`
      WHERE CandidateID = ?
      LIMIT 1`,
      [candidateId]
    );

    const [socialLinks] = await pool.query(
      'SELECT SMLID, UserID, "" as platform, "" as url FROM social_media_link WHERE UserID = ?',
      [candidateId]
    );

    const data = {
      fullName: `${user.FName} ${user.LName}`,
      avatar: user.avatar,
      title: '',
      experience: profile ? `${profile.YearOfExperience} years` : '',
      education: '',
      website: '',
      nationality: 'Vietnam',
      dateOfBirth: user.dateOfBirth,
      gender: null,
      maritalStatus: null,
      biography: '',
      location: user.location,
      phone: user.phone,
      email: user.Email,
      socialLinks,
      notifications: {
        shortlisted: true,
        jobAlerts: true,
        rejected: false
      },
      privacy: {
        profilePublic: true,
        resumePublic: false
      }
    };

    return success(res, data, 'Candidate profile retrieved successfully');
  } catch (err) {
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const candidateId = req.user.id;
    const {
      fullName,
      biography,
      location,
      phone,
      email
    } = req.body;

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (fullName || location || phone || email) {
        const [firstName, ...rest] = (fullName || '').split(' ');
        const lastName = rest.join(' ');
        await conn.query(
          `UPDATE \`user\`
           SET FName = COALESCE(?, FName),
               LName = COALESCE(?, LName),
               Address = COALESCE(?, Address),
               Phonenume = COALESCE(?, Phonenume),
               Email = COALESCE(?, Email)
           WHERE ID = ?`,
          [
            fullName ? firstName : null,
            fullName ? lastName : null,
            location || null,
            phone || null,
            email || null,
            candidateId
          ]
        );
      }

      // biography & other fields có thể lưu tạm vào profile.Description nếu cần

      await conn.commit();
      return success(res, null, 'Updated successfully');
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

async function uploadAvatar(req, res, next) {
  try {
    const candidateId = req.user.id;
    if (!req.file) {
      return fail(res, 'Avatar file is required', 400);
    }

    const relativePath = path.join('uploads', 'avatars', req.file.filename);
    const pool = getPool();
    await pool.query('UPDATE `user` SET Profile_Picture = ? WHERE ID = ?', [
      relativePath,
      candidateId
    ]);

    return success(res, { avatarUrl: relativePath }, 'Avatar uploaded successfully');
  } catch (err) {
    return next(err);
  }
}

async function getResumes(req, res, next) {
  try {
    const candidateId = req.user.id;
    const pool = getPool();
    const [[profile]] = await pool.query(
      'SELECT savedCv FROM `profile` WHERE CandidateID = ? LIMIT 1',
      [candidateId]
    );

    const list = [];
    if (profile && profile.savedCv) {
      list.push({
        id: 1,
        name: path.basename(profile.savedCv),
        size: '',
        url: profile.savedCv
      });
    }

    return success(res, list, 'Resumes retrieved successfully');
  } catch (err) {
    return next(err);
  }
}

async function uploadResume(req, res, next) {
  try {
    const candidateId = req.user.id;
    if (!req.file) {
      return fail(res, 'Resume file is required', 400);
    }

    const relativePath = path.join('uploads', 'resumes', req.file.filename);
    const pool = getPool();
    await pool.query(
      `INSERT INTO \`profile\` (ProfileID, Award, savedCv, YearOfExperience, CandidateID)
       VALUES (NULL, '', ?, 0, ?)
       ON DUPLICATE KEY UPDATE savedCv = VALUES(savedCv)`,
      [relativePath, candidateId]
    );

    return success(
      res,
      { id: 1, name: path.basename(relativePath), size: '', url: relativePath },
      'Resume uploaded successfully'
    );
  } catch (err) {
    return next(err);
  }
}

async function deleteResume(req, res, next) {
  try {
    const candidateId = req.user.id;
    const pool = getPool();
    await pool.query('UPDATE `profile` SET savedCv = NULL WHERE CandidateID = ?', [candidateId]);
    return success(res, null, 'Resume deleted successfully');
  } catch (err) {
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const candidateId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return fail(res, 'currentPassword và newPassword là bắt buộc', 400);
    }

    const pool = getPool();
    const [[user]] = await pool.query('SELECT Password FROM `user` WHERE ID = ?', [candidateId]);
    if (!user) {
      return fail(res, 'User not found', 404);
    }

    const matched = await bcrypt.compare(currentPassword, user.Password);
    if (!matched) {
      return fail(res, 'Mật khẩu hiện tại không đúng', 400);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE `user` SET Password = ? WHERE ID = ?', [hashed, candidateId]);
    return success(res, null, 'Password changed successfully');
  } catch (err) {
    return next(err);
  }
}

// Notifications cho candidate: do schema không có isRead, mock đơn giản
async function getNotifications(req, res, next) {
  try {
    const candidateId = req.user.id;
    const { page, limit, offset } = getPagination(req.query, 10);
    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT 
        nID as id,
        'application' as type,
        Title as title,
        Content as message,
        '' as company,
        Time as time,
        false as isRead
      FROM notification
      WHERE CandidateID = ?
      ORDER BY Time DESC
      LIMIT ? OFFSET ?`,
      [candidateId, limit, offset]
    );

    const [[{ total } = { total: 0 }]] = await pool.query(
      'SELECT COUNT(*) as total FROM notification WHERE CandidateID = ?',
      [candidateId]
    );

    const totalPages = Math.ceil(total / limit) || 1;

    return success(
      res,
      {
        notifications: rows,
        unreadCount: total,
        pagination: {
          total,
          page,
          totalPages,
          limit
        }
      },
      'Notifications retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
}

async function markNotificationRead(req, res) {
  return success(res, null, 'Marked as read (mock)');
}

async function markAllNotificationsRead(req, res) {
  return success(res, null, 'All marked as read (mock)');
}

async function deleteNotification(req, res) {
  return success(res, null, 'Notification deleted (mock)');
}

async function getUnreadCount(req, res) {
  return success(res, { count: 0 }, 'Unread count retrieved successfully');
}

module.exports = {
  getDashboard,
  getApplications,
  getProfile,
  updateProfile,
  uploadAvatar,
  getResumes,
  uploadResume,
  deleteResume,
  changePassword,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount
};


