const createHttpError = require('http-errors');
const packageModel = require('../models/packageModel');
const employerModel = require('../models/employerModel');
const { formatDate } = require('../utils/formatters');
const { setPaymentInfo } = require('../utils/paymentCache');
const { createPaymentRequest } = require('../utils/payos');
const config = require('../config/env');

const getAllPackages = async () => {
  const packages = await packageModel.getAllPackages();
  return packages.map((pkg) => ({
    PackageName: pkg.PackageName,
    cost: pkg.cost,
    description: pkg.desciption,
    time: pkg.time,
  }));
};

const getEmployerPackages = async (employerId) => {
  const purchases = await packageModel.getEmployerPurchases(employerId);
  return purchases.map((purchase) => ({
    pID: purchase.pID,
    PackageName: purchase.PackageName,
    cost: purchase.cost,
    description: purchase.desciption,
    time: purchase.time,
    purchaseDate: formatDate(purchase.purchaseDate),
  }));
};

const purchasePackage = async (employerId, packageName, paymentMethod) => {
  const employerIdInt = parseInt(employerId, 10);
  if (Number.isNaN(employerIdInt)) {
    throw createHttpError(400, 'EmployerID phải là số');
  }

  const pkg = await packageModel.getPackageByName(packageName);
  if (!pkg) {
    throw createHttpError(404, 'Package không tồn tại');
  }

  const employer = await employerModel.getEmployerProfile(employerIdInt);
  if (!employer) {
    throw createHttpError(404, 'Employer không tồn tại');
  }

  const pID = await packageModel.createPurchase(employerIdInt, packageName);
  const orderId = pID;

  setPaymentInfo(orderId, paymentMethod, 'pending');

  const payosConfig = config.payos;
  if (!payosConfig || !payosConfig.returnUrl || !payosConfig.cancelUrl) {
    return {
      orderId,
      packageName: pkg.PackageName,
      amount: pkg.cost,
      paymentMethod,
      status: 'pending',
      message: 'Purchase created but PayOS not configured',
    };
  }

  try {
    const paymentLink = await createPaymentRequest(
      orderId,
      pkg.cost,
      `Thanh toán gói ${pkg.PackageName}`,
      payosConfig.returnUrl,
      payosConfig.cancelUrl,
    );

    return {
      orderId,
      packageName: pkg.PackageName,
      amount: pkg.cost,
      paymentMethod,
      status: 'pending',
      paymentLink: paymentLink.checkoutUrl || paymentLink.paymentLink,
    };
  } catch (error) {
    return {
      orderId,
      packageName: pkg.PackageName,
      amount: pkg.cost,
      paymentMethod,
      status: 'pending',
      error: error.message,
    };
  }
};

module.exports = {
  getAllPackages,
  getEmployerPackages,
  purchasePackage,
};

