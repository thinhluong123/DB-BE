const createHttpError = require('http-errors');
const purchaseService = require('../services/purchaseService');
const { successResponse } = require('../utils/response');

const createPurchase = async (req, res, next) => {
  try {
    const { employerId, packageName, paymentMethod } = req.body;

    if (!employerId || !packageName) {
      throw createHttpError(400, 'employerId và packageName là bắt buộc');
    }

    const purchase = await purchaseService.createPurchase(employerId, packageName, paymentMethod);
    return successResponse(res, purchase, 'Mua package thành công', 201);
  } catch (error) {
    return next(error);
  }
};

const getPurchasesByEmployer = async (req, res, next) => {
  try {
    const { employerId } = req.params;

    if (!employerId) {
      throw createHttpError(400, 'employerId là bắt buộc');
    }

    const purchases = await purchaseService.getPurchasesByEmployer(employerId);
    return successResponse(res, purchases, 'Lấy danh sách purchases thành công');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPurchase,
  getPurchasesByEmployer,
};

