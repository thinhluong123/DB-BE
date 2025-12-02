const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createHttpError = require('http-errors');
const userModel = require('../models/userModel');
const config = require('../config/env');

const normalizeRole = (role, userRecord) => {
  if (role === 'employer') {
    if (!userRecord.EmployerID) {
      throw createHttpError(403, 'Tài khoản không thuộc doanh nghiệp');
    }
    return 'employer';
  }
  if (role === 'candidate') {
    if (!userRecord.CandidateID) {
      throw createHttpError(403, 'Tài khoản không thuộc ứng viên');
    }
    return 'candidate';
  }
  if (userRecord.EmployerID) return 'employer';
  if (userRecord.CandidateID) return 'candidate';
  throw createHttpError(400, 'Không xác định được vai trò người dùng');
};

const verifyPassword = async (plain, hashedOrPlain) => {
  try {
    const isMatch = await bcrypt.compare(plain, hashedOrPlain);
    if (isMatch) return true;
  } catch (error) {
    // ignore and fallback to plain compare
  }
  return plain === hashedOrPlain;
};

const generateToken = (payload) =>
  jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

const login = async ({ email, password, role }) => {
  if (!email || !password) {
    throw createHttpError(400, 'Email và mật khẩu là bắt buộc');
  }
  const userRecord = await userModel.getUserByEmail(email);
  if (!userRecord) {
    throw createHttpError(401, 'Email hoặc mật khẩu không đúng');
  }

  const match = await verifyPassword(password, userRecord.Password);
  if (!match) {
    throw createHttpError(401, 'Email hoặc mật khẩu không đúng');
  }

  const resolvedRole = normalizeRole(role, userRecord);
  const safeUser = {
    id: userRecord.ID,
    username: userRecord.Username,
    email: userRecord.Email,
    fullName: `${userRecord.FName} ${userRecord.LName}`.trim(),
    role: resolvedRole,
    candidateId: userRecord.CandidateID || null,
    employerId: userRecord.EmployerID || null,
  };
  const token = generateToken({
    userId: safeUser.id,
    role: safeUser.role,
    email: safeUser.email,
    candidateId: safeUser.candidateId,
    employerId: safeUser.employerId,
  });

  return {
    token,
    user: safeUser,
    role: resolvedRole,
  };
};

const resolveUserRecord = async (payload = {}) => {
  if (payload.userId) {
    return userModel.getUserById(payload.userId);
  }
  if (payload.candidateId) {
    return userModel.getUserByCandidateId(payload.candidateId);
  }
  if (payload.employerId) {
    return userModel.getUserByEmployerId(payload.employerId);
  }
  if (payload.email) {
    return userModel.getUserByEmail(payload.email);
  }
  return null;
};

const getProfile = async (payload = {}) => {
  const userRecord = await resolveUserRecord(payload);
  if (!userRecord) {
    throw createHttpError(401, 'Unauthorized');
  }

  return {
    id: userRecord.ID,
    username: userRecord.Username,
    email: userRecord.Email,
    fullName: `${userRecord.FName} ${userRecord.LName}`.trim(),
    role: payload.role || normalizeRole(undefined, userRecord),
    candidateId: userRecord.CandidateID || null,
    employerId: userRecord.EmployerID || null,
  };
};

module.exports = {
  login,
  getProfile,
};

