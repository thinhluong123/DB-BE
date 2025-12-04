const paymentService = require('../services/paymentService');
const { successResponse } = require('../utils/response');

const createPayOSLink = async (req, res, next) => {
  try {
    const { orderCode, amount, description, cancelUrl, returnUrl } = req.body;

    const paymentLink = await paymentService.createPayOSLink({
      orderCode,
      amount,
      description,
      cancelUrl,
      returnUrl,
    });

    return successResponse(res, paymentLink, 'Tạo link thanh toán thành công');
  } catch (error) {
    return next(error);
  }
};

const getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const status = await paymentService.getPaymentStatus(orderId);
    return successResponse(res, status, 'Lấy trạng thái thanh toán thành công');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPayOSLink,
  getPaymentStatus,
};

