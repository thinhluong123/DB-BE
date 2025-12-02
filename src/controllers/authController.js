const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const data = await authService.login({ email, password, role });
    return successResponse(res, data, 'Đăng nhập thành công');
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
  logout,
  getProfile,
};

