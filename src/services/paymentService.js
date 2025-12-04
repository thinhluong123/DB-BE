const createHttpError = require('http-errors');
const { getPaymentInfo, updatePaymentStatus } = require('../utils/paymentCache');
const { getPaymentRequest, createPaymentRequest } = require('../utils/payos');
const packageModel = require('../models/packageModel');

const createPayOSLink = async (orderId, amount, description, returnUrl, cancelUrl) => {
  const paymentLink = await createPaymentRequest(orderId, amount, description, returnUrl, cancelUrl);
  return paymentLink;
};

const checkPaymentStatus = async (orderId) => {
  const orderIdInt = parseInt(orderId, 10);
  if (Number.isNaN(orderIdInt)) {
    throw createHttpError(400, 'OrderID phải là số');
  }

  const purchase = await packageModel.getPurchaseByOrderId(orderIdInt);
  if (!purchase) {
    throw createHttpError(404, 'Purchase không tồn tại');
  }

  const cachedInfo = getPaymentInfo(orderIdInt);
  let status = cachedInfo?.status || 'unknown';
  let paymentMethod = cachedInfo?.paymentMethod || null;

  try {
    const payosResponse = await getPaymentRequest(orderIdInt);
    const payosStatus = payosResponse.status || payosResponse.data?.status;

    if (payosStatus === 'PAID' || payosStatus === 'paid') {
      status = 'paid';
      updatePaymentStatus(orderIdInt, 'paid');
    } else if (payosStatus === 'CANCELLED' || payosStatus === 'cancelled') {
      status = 'cancelled';
      updatePaymentStatus(orderIdInt, 'cancelled');
    } else if (payosStatus === 'PENDING' || payosStatus === 'pending') {
      status = 'pending';
      if (!cachedInfo) {
        updatePaymentStatus(orderIdInt, 'pending');
      }
    }

    return {
      orderId: orderIdInt,
      status,
      paymentMethod,
      purchase: {
        PackageName: purchase.PackageName,
        cost: purchase.cost,
        purchaseDate: purchase.purchaseDate,
      },
      payosData: payosResponse,
    };
  } catch (error) {
    if (error.status === 404) {
      return {
        orderId: orderIdInt,
        status: cachedInfo?.status || 'pending',
        paymentMethod,
        purchase: {
          PackageName: purchase.PackageName,
          cost: purchase.cost,
          purchaseDate: purchase.purchaseDate,
        },
        message: 'Payment request not found in PayOS',
      };
    }
    throw error;
  }
};

const updatePaymentStatusInCache = (orderId, status) => {
  return updatePaymentStatus(orderId, status);
};

const getPaymentInfoFromCache = (orderId) => {
  return getPaymentInfo(orderId);
};

module.exports = {
  createPayOSLink,
  checkPaymentStatus,
  updatePaymentStatusInCache,
  getPaymentInfoFromCache,
};

