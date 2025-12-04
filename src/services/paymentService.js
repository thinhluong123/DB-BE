const createHttpError = require('http-errors');
const crypto = require('crypto');

// Kiểm tra và import fetch nếu cần (Node.js < 18)
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  // Nếu fetch không có sẵn, cần cài node-fetch: npm install node-fetch@2
  try {
    // eslint-disable-next-line global-require
    fetch = require('node-fetch');
  } catch (err) {
    throw new Error('fetch is not available. Please install node-fetch: npm install node-fetch@2');
  }
} else {
  fetch = globalThis.fetch;
}

// PayOS configuration - cần thêm vào env
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || '';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || '';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '';
const PAYOS_BASE_URL = process.env.PAYOS_BASE_URL || 'https://api-merchant.payos.vn';

/**
 * Tạo link thanh toán PayOS
 * @param {Object} params - Thông tin thanh toán
 * @param {number} params.orderCode - Mã đơn hàng (unique)
 * @param {number} params.amount - Số tiền (VND)
 * @param {string} params.description - Mô tả đơn hàng
 * @param {string} params.cancelUrl - URL hủy thanh toán
 * @param {string} params.returnUrl - URL trả về sau thanh toán
 * @returns {Promise<Object>} Link thanh toán
 */
const createPayOSLink = async (params) => {
  const { orderCode, amount, description, cancelUrl, returnUrl } = params;

  if (!orderCode || !amount || !description || !cancelUrl || !returnUrl) {
    throw createHttpError(400, 'Thiếu thông tin bắt buộc để tạo link thanh toán');
  }

  if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
    throw createHttpError(500, 'PayOS chưa được cấu hình. Vui lòng kiểm tra environment variables.');
  }

  try {
    const checksumString = `${amount}|${cancelUrl}|${description}|${orderCode}|${returnUrl}`;
    const checksum = crypto.createHmac('sha256', PAYOS_CHECKSUM_KEY).update(checksumString).digest('hex');

    const response = await fetch(`${PAYOS_BASE_URL}/v2/payment-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY,
      },
      body: JSON.stringify({
        orderCode,
        amount,
        description,
        cancelUrl,
        returnUrl,
        signature: checksum,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw createHttpError(response.status, errorData.message || 'Lỗi khi tạo link thanh toán PayOS');
    }

    const responseData = await response.json();
    return {
      bin: responseData.bin || null,
      accountNumber: responseData.accountNumber || null,
      accountName: responseData.accountName || null,
      amount: responseData.amount,
      description: responseData.description,
      orderCode: responseData.orderCode,
      paymentLinkId: responseData.paymentLinkId,
      qrCode: responseData.qrCode || null,
      checkoutUrl: responseData.checkoutUrl,
      status: responseData.status,
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw createHttpError(500, `Lỗi khi gọi PayOS API: ${error.message}`);
  }
};

/**
 * Kiểm tra trạng thái thanh toán
 * @param {string|number} orderId - Mã đơn hàng
 * @returns {Promise<Object>} Trạng thái thanh toán
 */
const getPaymentStatus = async (orderId) => {
  if (!orderId) {
    throw createHttpError(400, 'orderId là bắt buộc');
  }

  if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY) {
    throw createHttpError(500, 'PayOS chưa được cấu hình. Vui lòng kiểm tra environment variables.');
  }

  try {
    const response = await fetch(`${PAYOS_BASE_URL}/v2/payment-requests/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw createHttpError(404, 'Không tìm thấy đơn hàng');
      }
      const errorData = await response.json().catch(() => ({}));
      throw createHttpError(response.status, errorData.message || 'Lỗi khi kiểm tra trạng thái thanh toán');
    }

    const paymentData = await response.json();
    return {
      orderCode: paymentData.orderCode,
      amount: paymentData.amount,
      description: paymentData.description,
      accountNumber: paymentData.accountNumber || null,
      accountName: paymentData.accountName || null,
      counterAccountBankId: paymentData.counterAccountBankId || null,
      counterAccountBankName: paymentData.counterAccountBankName || null,
      counterAccountName: paymentData.counterAccountName || null,
      counterAccountNumber: paymentData.counterAccountNumber || null,
      virtualAccountName: paymentData.virtualAccountName || null,
      virtualAccountNumber: paymentData.virtualAccountNumber || null,
      reference: paymentData.reference || null,
      transactionDateTime: paymentData.transactionDateTime || null,
      paymentLinkId: paymentData.paymentLinkId,
      code: paymentData.code,
      desc: paymentData.desc,
      canceledAt: paymentData.canceledAt || null,
      canceledReason: paymentData.canceledReason || null,
      status: paymentData.status, // PENDING, PROCESSING, PAID, CANCELLED
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw createHttpError(500, `Lỗi khi gọi PayOS API: ${error.message}`);
  }
};

module.exports = {
  createPayOSLink,
  getPaymentStatus,
};

