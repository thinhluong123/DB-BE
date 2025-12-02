const publicService = require('../services/publicService');

const getStats = async (req, res, next) => {
  try {
    const stats = await publicService.getHomepageStats();
    // Trả về trực tiếp mảng để frontend có thể dùng .map()
    // Frontend HomePage đang expect: [ { icon, number, label }, ... ]
    return res.status(200).json(stats);
  } catch (error) {
    return next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await publicService.getJobCategories();
    // Trả về trực tiếp mảng category cho HomePage (categories.map(...))
    return res.status(200).json(categories);
  } catch (error) {
    return next(error);
  }
};

const getTopCompanies = async (req, res, next) => {
  try {
    const limit = Number.isFinite(Number(req.query.limit)) ? Number(req.query.limit) : 8;
    const companies = await publicService.getTopCompanies(limit);
    // Trả về trực tiếp mảng company cho HomePage (topCompanies.map(...))
    return res.status(200).json(companies);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getStats,
  getCategories,
  getTopCompanies,
};

