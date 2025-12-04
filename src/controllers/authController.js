const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    return successResponse(res, data, 'Đăng nhập thành công');
  } catch (error) {
    return next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const data = await authService.registerCandidate(req.body);
    return successResponse(res, data, 'Đăng ký thành công', 201);
  } catch (error) {
    return next(error);
  }
};

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
  login,
  register,
  logout,
  getProfile,
};

