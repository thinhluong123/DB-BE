const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

// Candidate auth
const loginCandidate = async (req, res, next) => {
  try {
    const data = await authService.loginCandidate(req.body);
    return successResponse(res, data, 'Đăng nhập thành công');
  } catch (error) {
    return next(error);
  }
};

const registerCandidate = async (req, res, next) => {
  try {
    const data = await authService.registerCandidate(req.body);
    return successResponse(res, data, 'Đăng ký thành công', 201);
  } catch (error) {
    return next(error);
  }
};

// Employer auth
const loginEmployer = async (req, res, next) => {
  try {
    const data = await authService.loginEmployer(req.body);
    return successResponse(res, data, 'Đăng nhập thành công');
  } catch (error) {
    return next(error);
  }
};

const registerEmployer = async (req, res, next) => {
  try {
    const data = await authService.registerEmployer(req.body);
    return successResponse(res, data, 'Đăng ký thành công', 201);
  } catch (error) {
    return next(error);
  }
};

// Common
const logout = async (req, res, next) => {
  try {
    return successResponse(res, null, 'Đăng xuất thành công');
  } catch (error) {
    return next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user);
    return successResponse(res, profile, 'Profile retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  loginCandidate,
  registerCandidate,
  loginEmployer,
  registerEmployer,
  logout,
  getProfile,
};

