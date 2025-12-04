const crypto = require('crypto');
const axios = require('axios');
const createHttpError = require('http-errors');
const config = require('../config/env');

const generateChecksum = (data, checksumKey) => {
  const dataString = JSON.stringify(data);
  const hmac = crypto.createHmac('sha256', checksumKey);
  hmac.update(dataString);
  return hmac.digest('hex');
};

const createPaymentRequest = async (orderId, amount, description, returnUrl, cancelUrl) => {
  const payosConfig = config.payos;
  if (!payosConfig || !payosConfig.clientId || !payosConfig.apiKey || !payosConfig.checksumKey) {
    throw createHttpError(500, 'PayOS configuration is missing');
  }

  const paymentData = {
    orderCode: parseInt(orderId, 10),
    amount: parseInt(amount, 10),
    description,
    cancelUrl,
    returnUrl,
  };

  const checksum = generateChecksum(paymentData, payosConfig.checksumKey);
  paymentData.signature = checksum;

  try {
    const response = await axios.post('https://api.payos.vn/v2/payment-requests', paymentData, {
      headers: {
        'x-client-id': payosConfig.clientId,
        'x-api-key': payosConfig.apiKey,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw createHttpError(error.response.status, error.response.data?.message || 'PayOS API error');
    }
    throw createHttpError(500, 'Failed to create PayOS payment request');
  }
};

const getPaymentRequest = async (orderId) => {
  const payosConfig = config.payos;
  if (!payosConfig || !payosConfig.clientId || !payosConfig.apiKey) {
    throw createHttpError(500, 'PayOS configuration is missing');
  }

  try {
    const response = await axios.get(`https://api.payos.vn/v2/payment-requests/${orderId}`, {
      headers: {
        'x-client-id': payosConfig.clientId,
        'x-api-key': payosConfig.apiKey,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw createHttpError(404, 'Payment request not found');
      }
      throw createHttpError(error.response.status, error.response.data?.message || 'PayOS API error');
    }
    throw createHttpError(500, 'Failed to get PayOS payment request');
  }
};

module.exports = {
  generateChecksum,
  createPaymentRequest,
  getPaymentRequest,
};

