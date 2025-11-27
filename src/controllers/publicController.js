const publicService = require('../services/publicService');
const { successResponse } = require('../utils/response');

const getStats = async (req, res, next) => {
  try {
    const stats = await publicService.getHomepageStats();
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await publicService.getJobCategories();
    return successResponse(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

const getTopCompanies = async (req, res, next) => {
  try {
    const limit = Number.isFinite(Number(req.query.limit)) ? Number(req.query.limit) : 8;
    const companies = await publicService.getTopCompanies(limit);
    return successResponse(res, companies, 'Companies retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getStats,
  getCategories,
  getTopCompanies,
};

