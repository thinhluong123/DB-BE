const packageService = require('../services/packageService');
const { successResponse } = require('../utils/response');

const getAllPackages = async (req, res, next) => {
  try {
    const packages = await packageService.getAllPackages();
    return successResponse(res, packages, 'Packages retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

const getEmployerPackages = async (req, res, next) => {
  try {
    const packages = await packageService.getEmployerPackages(req.params.employerId);
    return successResponse(res, packages, 'Employer packages retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

const purchasePackage = async (req, res, next) => {
  try {
    const { employerId, packageName, paymentMethod } = req.body;
    if (!employerId || !packageName || !paymentMethod) {
      return next(require('http-errors').BadRequest('employerId, packageName và paymentMethod là bắt buộc'));
    }
    const result = await packageService.purchasePackage(employerId, packageName, paymentMethod);
    return successResponse(res, result, 'Purchase initiated successfully', 201);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllPackages,
  getEmployerPackages,
  purchasePackage,
};

