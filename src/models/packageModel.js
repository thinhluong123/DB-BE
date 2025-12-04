const createHttpError = require('http-errors');
const { executeQuery } = require('../config/database');

const getAllPackages = async () => {
  const rows = await executeQuery('SELECT PackageName, cost, desciption, time FROM package ORDER BY cost ASC');
  return rows;
};

const getPackageByName = async (packageName) => {
  const rows = await executeQuery('SELECT PackageName, cost, desciption, time FROM package WHERE PackageName = ?', [packageName]);
  return rows[0] || null;
};

const getEmployerPurchases = async (employerId) => {
  const rows = await executeQuery(
    `
    SELECT 
      p.pID,
      p.EmpID,
      p.PackageName,
      p.purchaseDate,
      pk.cost,
      pk.desciption,
      pk.time
    FROM purchase p
    JOIN package pk ON p.PackageName = pk.PackageName
    WHERE p.EmpID = ?
    ORDER BY p.purchaseDate DESC
  `,
    [employerId],
  );
  return rows;
};

const createPurchase = async (employerId, packageName) => {
  const result = await executeQuery(
    `
    INSERT INTO purchase (EmpID, PackageName, purchaseDate)
    VALUES (?, ?, CURDATE())
  `,
    [employerId, packageName],
  );
  return result.insertId;
};

const getPurchaseByOrderId = async (orderId) => {
  const rows = await executeQuery(
    `
    SELECT 
      p.pID,
      p.EmpID,
      p.PackageName,
      p.purchaseDate,
      pk.cost,
      pk.desciption,
      pk.time
    FROM purchase p
    JOIN package pk ON p.PackageName = pk.PackageName
    WHERE p.pID = ?
  `,
    [orderId],
  );
  return rows[0] || null;
};

const getPurchaseById = async (pId) => {
  const rows = await executeQuery(
    `
    SELECT 
      p.pID,
      p.EmpID,
      p.PackageName,
      p.purchaseDate,
      pk.cost,
      pk.desciption,
      pk.time
    FROM purchase p
    JOIN package pk ON p.PackageName = pk.PackageName
    WHERE p.pID = ?
  `,
    [pId],
  );
  return rows[0] || null;
};

module.exports = {
  getAllPackages,
  getPackageByName,
  getEmployerPurchases,
  createPurchase,
  getPurchaseByOrderId,
  getPurchaseById,
};

