const paymentCache = new Map();

const setPaymentInfo = (orderId, paymentMethod, status = 'pending') => {
  paymentCache.set(orderId, {
    paymentMethod,
    status,
    createdAt: new Date().toISOString(),
  });
};

const getPaymentInfo = (orderId) => {
  return paymentCache.get(orderId) || null;
};

const updatePaymentStatus = (orderId, status) => {
  const existing = paymentCache.get(orderId);
  if (existing) {
    paymentCache.set(orderId, {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    });
    return true;
  }
  return false;
};

const deletePaymentInfo = (orderId) => {
  return paymentCache.delete(orderId);
};

module.exports = {
  setPaymentInfo,
  getPaymentInfo,
  updatePaymentStatus,
  deletePaymentInfo,
};

