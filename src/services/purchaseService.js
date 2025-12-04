const createHttpError = require('http-errors');
const purchaseModel = require('../models/purchaseModel');
const packageModel = require('../models/packageModel');

const createPurchase = async (employerId, packageName, paymentMethod) => {
  if (!employerId || !packageName) {
    throw createHttpError(400, 'employerId và packageName là bắt buộc');
  }

  // Kiểm tra package có tồn tại không
  const pkg = await packageModel.getPackageByName(packageName);
  if (!pkg) {
    throw createHttpError(404, 'Package không tồn tại');
  }

  // Tạo purchase
  const purchase = await purchaseModel.createPurchase(employerId, packageName, paymentMethod);

  return {
    purchaseId: purchase.pID,
    employerId: purchase.EmpID,
    packageName: purchase.PackageName,
    purchaseDate: purchase.purchaseDate,
    cost: purchase.cost,
    paymentMethod: paymentMethod || null,
  };
};

const getPurchasesByEmployer = async (employerId) => {
  if (!employerId) {
    throw createHttpError(400, 'employerId là bắt buộc');
  }

  const purchases = await purchaseModel.getPurchasesByEmployer(employerId);
  return purchases.map((purchase) => ({
    purchaseId: purchase.pID,
    employerId: purchase.EmpID,
    packageName: purchase.PackageName,
    purchaseDate: purchase.purchaseDate,
    cost: purchase.cost,
    description: purchase.description,
    time: purchase.time,
  }));
};

module.exports = {
  createPurchase,
  getPurchasesByEmployer,
};

