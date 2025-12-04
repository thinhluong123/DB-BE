const paymentService = require('../services/paymentService');
const { successResponse } = require('../utils/response');

const createPayOSLink = async (req, res, next) => {
  try {
    const { orderId, amount, description, returnUrl, cancelUrl } = req.body;
    if (!orderId || !amount) {
      return next(require('http-errors').BadRequest('orderId và amount là bắt buộc'));
    }
    const paymentLink = await paymentService.createPayOSLink(orderId, amount, description, returnUrl, cancelUrl);
    return successResponse(res, paymentLink, 'Payment link created successfully', 201);
  } catch (error) {
    return next(error);
  }
};

const checkPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const status = await paymentService.checkPaymentStatus(orderId);
    return successResponse(res, status, 'Payment status retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPayOSLink,
  checkPaymentStatus,
};

