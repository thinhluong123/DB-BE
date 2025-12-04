const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createHttpError = require('http-errors');
const userModel = require('../models/userModel');
const candidateModel = require('../models/candidateModel');
const employerModel = require('../models/employerModel');
const config = require('../config/env');

const detectRole = (userRecord) => {
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

const loginCandidate = async (payload = {}) => {
  const email = payload.email || payload.Email;
  const password = payload.password || payload.Password;

  if (!email || !password) {
    throw createHttpError(400, 'Email và mật khẩu là bắt buộc');
  }

  const userRecord = await userModel.getUserByEmail(email);
  if (!userRecord) {
    throw createHttpError(401, 'Email hoặc mật khẩu không đúng');
  }

  if (!userRecord.CandidateID) {
    throw createHttpError(403, 'Tài khoản không thuộc ứng viên');
  }

  const match = await verifyPassword(password, userRecord.Password);
  if (!match) {
    throw createHttpError(401, 'Email hoặc mật khẩu không đúng');
  }

  const safeUser = {
    id: userRecord.ID,
    username: userRecord.Username,
    email: userRecord.Email,
    fullName: `${userRecord.FName} ${userRecord.LName}`.trim(),
    role: 'candidate',
    candidateId: userRecord.CandidateID,
    employerId: null,
  };
  const token = generateToken({
    userId: safeUser.id,
    role: 'candidate',
    email: safeUser.email,
    candidateId: safeUser.candidateId,
    employerId: null,
  });

  return {
    token,
    user: safeUser,
    role: 'candidate',
  };
};

const loginEmployer = async (payload = {}) => {
  const email = payload.email || payload.Email;
  const password = payload.password || payload.Password;

  if (!email || !password) {
    throw createHttpError(400, 'Email và mật khẩu là bắt buộc');
  }

  const userRecord = await userModel.getUserByEmail(email);
  if (!userRecord) {
    throw createHttpError(401, 'Email hoặc mật khẩu không đúng');
  }

  if (!userRecord.EmployerID) {
    throw createHttpError(403, 'Tài khoản không thuộc doanh nghiệp');
  }

  const match = await verifyPassword(password, userRecord.Password);
  if (!match) {
    throw createHttpError(401, 'Email hoặc mật khẩu không đúng');
  }

  const safeUser = {
    id: userRecord.ID,
    username: userRecord.Username,
    email: userRecord.Email,
    fullName: `${userRecord.FName} ${userRecord.LName}`.trim(),
    role: 'employer',
    candidateId: null,
    employerId: userRecord.EmployerID,
  };
  const token = generateToken({
    userId: safeUser.id,
    role: 'employer',
    email: safeUser.email,
    candidateId: null,
    employerId: safeUser.employerId,
  });

  return {
    token,
    user: safeUser,
    role: 'employer',
  };
};

const registerCandidate = async (payload = {}) => {
  const fullNameRaw = payload.fullName || payload.FullName || '';
  const username = payload.username || payload.Username;
  const email = payload.email || payload.Email;
  const password = payload.password || payload.Password;

  if (!fullNameRaw || !username || !email || !password) {
    throw createHttpError(400, 'Họ tên, username, email và mật khẩu là bắt buộc');
  }

  // Kiểm tra email đã tồn tại chưa
  const existing = await userModel.getUserByEmail(email);
  if (existing) {
    throw createHttpError(409, 'Email đã được sử dụng');
  }

  // Tách họ và tên
  const nameParts = fullNameRaw.trim().split(/\s+/);
  const FName = nameParts[0] || '';
  const LName = nameParts.slice(1).join(' ') || FName;

  // Hash mật khẩu
  const hashedPassword = await bcrypt.hash(password, 10);

  // Tạo user mới trong bảng user
  const userId = await userModel.createUser({
    Username: username,
    Email: email,
    Password: hashedPassword,
    FName,
    LName,
    Address: payload.address || 'Chưa cập nhật',
    Phonenumber: payload.phone || payload.Phonenumber || '0000000000',
    Profile_Picture: payload.Profile_Picture || null,
    Bdate: payload.Bdate || '2000-01-01',
  });

  // Gắn vào bảng candidate để login nhận diện là ứng viên
  await candidateModel.createCandidate(userId);

  const safeUser = {
    id: userId,
    username,
    email,
    fullName: `${FName} ${LName}`.trim(),
    role: 'candidate',
    candidateId: userId,
    employerId: null,
  };

  const token = generateToken({
    userId: safeUser.id,
    role: safeUser.role,
    email: safeUser.email,
    candidateId: safeUser.candidateId,
    employerId: null,
  });

  return {
    token,
    user: safeUser,
    role: 'candidate',
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

const registerEmployer = async (payload = {}) => {
  const fullNameRaw = payload.fullName || payload.FullName || '';
  const username = payload.username || payload.Username;
  const email = payload.email || payload.Email;
  const password = payload.password || payload.Password;

  if (!fullNameRaw || !username || !email || !password) {
    throw createHttpError(400, 'Họ tên, username, email và mật khẩu là bắt buộc');
  }

  // Kiểm tra email đã tồn tại chưa
  const existing = await userModel.getUserByEmail(email);
  if (existing) {
    throw createHttpError(409, 'Email đã được sử dụng');
  }

  // Tách họ và tên
  const nameParts = fullNameRaw.trim().split(/\s+/);
  const FName = nameParts[0] || '';
  const LName = nameParts.slice(1).join(' ') || FName;

  // Hash mật khẩu
  const hashedPassword = await bcrypt.hash(password, 10);

  // Tạo user mới trong bảng user
  const userId = await userModel.createUser({
    Username: username,
    Email: email,
    Password: hashedPassword,
    FName,
    LName,
    Address: payload.address || 'Chưa cập nhật',
    Phonenumber: payload.phone || payload.Phonenumber || '0000000000',
    Profile_Picture: payload.Profile_Picture || null,
    Bdate: payload.Bdate || '2000-01-01',
  });

  // Gắn vào bảng employer để login nhận diện là doanh nghiệp
  await employerModel.createEmployer(userId);

  const safeUser = {
    id: userId,
    username,
    email,
    fullName: `${FName} ${LName}`.trim(),
    role: 'employer',
    candidateId: null,
    employerId: userId,
  };

  const token = generateToken({
    userId: safeUser.id,
    role: 'employer',
    email: safeUser.email,
    candidateId: null,
    employerId: safeUser.employerId,
  });

  return {
    token,
    user: safeUser,
    role: 'employer',
  };
};

const getProfile = async (payload = {}) => {
  const userRecord = await resolveUserRecord(payload);
  if (!userRecord) {
    throw createHttpError(401, 'Unauthorized');
  }

  const role = detectRole(userRecord);
  return {
    id: userRecord.ID,
    username: userRecord.Username,
    email: userRecord.Email,
    fullName: `${userRecord.FName} ${userRecord.LName}`.trim(),
    role,
    candidateId: userRecord.CandidateID || null,
    employerId: userRecord.EmployerID || null,
  };
};

module.exports = {
  loginCandidate,
  loginEmployer,
  registerCandidate,
  registerEmployer,
  getProfile,
};

