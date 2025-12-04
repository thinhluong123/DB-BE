const createHttpError = require('http-errors');
const bcrypt = require('bcryptjs');
const candidateModel = require('../models/candidateModel');
const jobModel = require('../models/jobModel');
const userModel = require('../models/userModel');
const { executeQuery } = require('../config/database');
const { formatCurrencyRange, formatDate } = require('../utils/formatters');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const resolveCandidateId = async (source) => {
  const candidateIdRaw = source?.candidateId || source?.CandidateID || source?.candidateID;
  if (!candidateIdRaw) {
    throw createHttpError(400, 'CandidateID is required');
  }
  const candidateId = candidateModel.toPositiveInt(candidateIdRaw);
  await candidateModel.ensureCandidateExists(candidateId);
  return candidateId;
};

const favoriteJob = async (jobIdRaw, requestData) => {
  const jobId = parseInt(jobIdRaw, 10);
  if (Number.isNaN(jobId)) {
    throw createHttpError(400, 'JobID must be a number');
  }
  const candidateId = await resolveCandidateId(requestData);
  await candidateModel.addFavourite(candidateId, jobId);
  return {
    JobID: jobId,
    favorited: true,
    SaveDate: new Date().toISOString(),
    CandidateID: candidateId,
  };
};

const unfavoriteJob = async (jobIdRaw, requestData) => {
  const jobId = parseInt(jobIdRaw, 10);
  if (Number.isNaN(jobId)) {
    throw createHttpError(400, 'JobID must be a number');
  }
  const candidateId = await resolveCandidateId(requestData);
  await candidateModel.removeFavourite(candidateId, jobId);
  return {
    JobID: jobId,
    favorited: false,
  };
};

const applyJob = async (jobIdRaw, payload) => {
  const jobId = parseInt(jobIdRaw, 10);
  if (Number.isNaN(jobId)) {
    throw createHttpError(400, 'JobID must be a number');
  }
  const candidateId = await resolveCandidateId(payload);
  const job = await jobModel.fetchJobById(jobId);
  if (!job) {
    throw createHttpError(404, 'Job not found');
  }
  await candidateModel.addApplication(candidateId, jobId, payload);
  return {
    JobID: jobId,
    CandidateID: candidateId,
    Status: 'submitted',
    applied_at: new Date().toISOString(),
  };
};

const checkJobStatus = async (jobIdRaw, requestData) => {
  const jobId = parseInt(jobIdRaw, 10);
  if (Number.isNaN(jobId)) {
    throw createHttpError(400, 'JobID must be a number');
  }
  const candidateId = await resolveCandidateId(requestData);
  const [favorited, applied, job] = await Promise.all([
    candidateModel.isJobFavorited(candidateId, jobId),
    candidateModel.isJobApplied(candidateId, jobId),
    jobModel.fetchJobById(jobId),
  ]);
  if (!job) {
    throw createHttpError(404, 'Job not found');
  }
  return {
    JobID: jobId,
    favorited,
    applied,
    canApply: !applied && job.JobStatus !== 'CLOSED',
    applicationDeadline: formatDate(job.ExpireDate),
  };
};

const getDashboard = async (requestData) => {
  const candidateId = await resolveCandidateId(requestData);
  const [profile, stats, applications] = await Promise.all([
    candidateModel.getCandidateProfile(candidateId),
    candidateModel.getCandidateStats(candidateId),
    candidateModel.getRecentApplications(candidateId),
  ]);

  return {
    user: {
      name: `${profile?.FName || ''} ${profile?.LName || ''}`.trim(),
      avatar: profile?.Profile_Picture || null,
      profileCompletion: profile?.savedCv ? 80 : 50,
    },
    stats: {
      appliedJobs: stats?.appliedJobs || 0,
      favoriteJobs: stats?.favoriteJobs || 0,
      jobAlerts: stats?.jobAlerts || 0,
    },
    recentApplications: applications.map((item) => ({
      id: item.JobID,
      jobId: item.JobID,
      title: item.JobName,
      company: item.CompanyName || 'N/A',
      logo: item.CompanyLogo,
      location: item.Location,
      salary: formatCurrencyRange(item.SalaryFrom, item.SalaryTo),
      type: item.JobType,
      appliedAt: formatDate(item.AppliedDate),
      status: item.Status_apply || 'pending',
    })),
  };
};

const listApplications = async (requestData, query = {}) => {
  const candidateId = await resolveCandidateId(requestData);
  const { page, limit, offset } = getPaginationParams({ page: query.page, limit: query.limit || 20 });

  const [rows, total] = await Promise.all([
    candidateModel.listCandidateApplications(candidateId, limit, offset),
    candidateModel.countCandidateApplications(candidateId),
  ]);

  const applications = rows.map((item) => ({
    JobID: item.JobID,
    title: item.JobName,
    company: item.CompanyName,
    location: item.Location,
    salary: formatCurrencyRange(item.SalaryFrom, item.SalaryTo),
    type: item.JobType,
    status: item.Status_apply || 'pending',
    appliedAt: formatDate(item.AppliedDate),
    coverLetter: item.CoverLetter,
    uploadCV: item.upLoadCV,
  }));

  return {
    applications,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getFavorites = async (requestData) => {
  const candidateId = await resolveCandidateId(requestData);
  const rows = await candidateModel.getFavouriteJobs(candidateId);

  return rows.map((item) => ({
    JobID: item.JobID,
    JobName: item.JobName,
    JobType: item.JobType,
    ContractType: item.ContractType,
    Level: item.Level,
    Location: item.Location,
    Salary: formatCurrencyRange(item.SalaryFrom, item.SalaryTo),
    SalaryFrom: item.SalaryFrom,
    SalaryTo: item.SalaryTo,
    JobStatus: item.JobStatus,
    ExpireDate: formatDate(item.ExpireDate),
    Company: {
      CompanyID: item.CompanyID,
      CompanyName: item.CompanyName,
      CompanyLogo: item.CompanyLogo,
    },
    savedAt: formatDate(item.Date),
  }));
};

module.exports = {
  favoriteJob,
  unfavoriteJob,
  applyJob,
  checkJobStatus,
  getDashboard,
  listApplications,
  getFavorites,
  // profile & settings
  getProfile: async (requestData) => {
    const candidateId = await resolveCandidateId(requestData);
    const user = await userModel.getUserByCandidateId(candidateId);
    if (!user) {
      throw createHttpError(404, 'Candidate not found');
    }

    const profile = await candidateModel.getCandidateProfile(candidateId);

    const fullName = `${user.FName || ''} ${user.LName || ''}`.trim();

    return {
      fullName,
      avatar: user.Profile_Picture || null,
      title: null,
      experience: profile?.YearOfExperience != null ? `${profile.YearOfExperience} years` : null,
      education: null,
      website: null,
      nationality: null,
      dateOfBirth: user.Bdate ? formatDate(user.Bdate) : null,
      gender: null,
      maritalStatus: null,
      biography: null,
      location: user.Address || null,
      phone: user.Phonenumber || null,
      email: user.Email || null,
      socialLinks: [],
      notifications: {
        shortlisted: true,
        jobAlerts: true,
        rejected: true,
      },
      privacy: {
        profilePublic: true,
        resumePublic: true,
      },
    };
  },

  updateProfile: async (payload) => {
    const candidateId = await resolveCandidateId(payload);
    const user = await userModel.getUserByCandidateId(candidateId);
    if (!user) {
      throw createHttpError(404, 'Candidate not found');
    }

    const fields = {};
    if (payload.fullName) {
      const parts = payload.fullName.trim().split(' ');
      // eslint-disable-next-line prefer-destructuring
      fields.FName = parts[0];
      fields.LName = parts.slice(1).join(' ') || parts[0];
    }
    if (payload.location) fields.Address = payload.location;
    if (payload.phone) fields.Phonenumber = payload.phone;
    if (payload.dateOfBirth) fields.Bdate = payload.dateOfBirth;

    if (Object.keys(fields).length) {
      const setClause = Object.keys(fields)
        .map((key) => `${key} = ?`)
        .join(', ');
      const values = Object.values(fields);
      await executeQuery(`UPDATE user SET ${setClause} WHERE ID = ?`, [...values, user.ID]);
    }
  },

  uploadAvatar: async (payload) => {
    const candidateId = await resolveCandidateId(payload);
    const user = await userModel.getUserByCandidateId(candidateId);
    if (!user) {
      throw createHttpError(404, 'Candidate not found');
    }

    const avatarUrl = payload.avatar || payload.avatarUrl || null;
    if (!avatarUrl) {
      throw createHttpError(400, 'avatar (url) is required');
    }

    await executeQuery('UPDATE user SET Profile_Picture = ? WHERE ID = ?', [avatarUrl, user.ID]);

    return { avatarUrl };
  },

  getResumes: async (requestData) => {
    const candidateId = await resolveCandidateId(requestData);
    const profile = await candidateModel.getCandidateProfile(candidateId);

    if (!profile || !profile.savedCv) {
      return [];
    }

    // Chỉ map 1 resume từ cột savedCv
    return [
      {
        id: 1,
        name: profile.savedCv,
        size: null,
        url: profile.savedCv,
      },
    ];
  },

  uploadResume: async (payload) => {
    const candidateId = await resolveCandidateId(payload);

    const resumeUrl = payload.url || payload.fileUrl || payload.file || null;
    if (!resumeUrl) {
      throw createHttpError(400, 'Resume url/file is required');
    }

    // Upsert vào bảng profile.savedCv (nếu chưa có profile thì tạo bản ghi tối giản)
    await executeQuery(
      `
      INSERT INTO profile (ProfileID, savedCv, YearOfExperience, CandidateID)
      VALUES (?, ?, 0, ?)
      ON DUPLICATE KEY UPDATE savedCv = VALUES(savedCv)
    `,
      [candidateId, resumeUrl, candidateId],
    );

    return {
      id: 1,
      name: resumeUrl,
      size: null,
      url: resumeUrl,
    };
  },

  deleteResume: async (payload) => {
    const candidateId = await resolveCandidateId(payload);
    // Xóa đơn giản: set savedCv = NULL
    await executeQuery('UPDATE profile SET savedCv = NULL WHERE CandidateID = ?', [candidateId]);
  },

  changePassword: async (payload) => {
    const candidateId = await resolveCandidateId(payload);
    const user = await userModel.getUserByCandidateId(candidateId);
    if (!user) {
      throw createHttpError(404, 'Candidate not found');
    }

    if (!payload.currentPassword || !payload.newPassword) {
      throw createHttpError(400, 'currentPassword và newPassword là bắt buộc');
    }

    const match = await bcrypt.compare(payload.currentPassword, user.Password);
    if (!match) {
      throw createHttpError(400, 'Mật khẩu hiện tại không đúng');
    }

    const hashed = await bcrypt.hash(payload.newPassword, 10);
    await executeQuery('UPDATE user SET Password = ? WHERE ID = ?', [hashed, user.ID]);
  },

  // notifications (dùng bảng notification, filter theo CandidateID)
  getNotifications: async (requestData) => {
    const candidateId = await resolveCandidateId(requestData);
    const { page, limit, offset } = getPaginationParams({
      page: requestData.page,
      limit: requestData.limit || 10,
    });

    // LIMIT / OFFSET đã được chuẩn hoá thành số, nên có thể nội suy trực tiếp
    const rows = await executeQuery(
      `
      SELECT 
        nID,
        Title,
        Content,
        \`Time\`,
        JobID,
        CandidateID
      FROM notification
      WHERE CandidateID = ?
      ORDER BY \`Time\` DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
      [candidateId],
    );

    const notifications = rows.map((item) => ({
      id: item.nID,
      type: requestData.type || 'application',
      title: item.Title,
      message: item.Content,
      company: null,
      time: formatDate(item.Time),
      isRead: false,
    }));

    return {
      notifications,
      // frontend spec chỉ cần notifications + unreadCount; pagination giữ nội bộ nếu cần
      pagination: buildPaginationMeta(page, limit, notifications.length),
      unreadCount: notifications.length,
    };
  },

  markNotificationRead: async () => {
    // Chưa có cột isRead trong bảng notification -> tạm thời no-op
  },

  markAllNotificationsRead: async () => {
    // No-op tương tự
  },

  deleteNotification: async (payload) => {
    const candidateId = await resolveCandidateId(payload);
    const id = parseInt(payload.id, 10);
    if (Number.isNaN(id)) {
      throw createHttpError(400, 'Notification id must be a number');
    }
    await executeQuery('DELETE FROM notification WHERE nID = ? AND CandidateID = ?', [id, candidateId]);
  },

  getUnreadNotificationCount: async (requestData) => {
    const candidateId = await resolveCandidateId(requestData);
    // Chưa có trạng thái isRead nên tạm thời trả 0
    return { count: 0, candidateId };
  },
};

