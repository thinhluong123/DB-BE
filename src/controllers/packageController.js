const packageService = require('../services/packageService');
const { successResponse } = require('../utils/response');

const getAllPackages = async (req, res, next) => {
  try {
    const packages = await packageService.getAllPackages();
    return successResponse(res, packages, 'Lấy danh sách packages thành công');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllPackages,
};

