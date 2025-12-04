const createHttpError = require('http-errors');
const { executeQuery, getConnection } = require('../config/database');

const createPurchase = async (employerId, packageName, paymentMethod = null) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    // Kiểm tra package có tồn tại không
    const packageRows = await connection.query(
      'SELECT PackageName, cost FROM package WHERE PackageName = ?',
      [packageName],
    );
    if (!packageRows[0] || packageRows[0].length === 0) {
      throw createHttpError(404, 'Package không tồn tại');
    }

    // Kiểm tra employer có tồn tại không
    const employerRows = await connection.query(
      'SELECT ID FROM employer WHERE ID = ?',
      [employerId],
    );
    if (!employerRows[0] || employerRows[0].length === 0) {
      throw createHttpError(404, 'Employer không tồn tại');
    }

    // Tạo purchase record
    const [result] = await connection.query(
      `
      INSERT INTO purchase (EmpID, PackageName, purchaseDate)
      VALUES (?, ?, CURDATE())
    `,
      [employerId, packageName],
    );

    await connection.commit();
    return {
      pID: result.insertId,
      EmpID: employerId,
      PackageName: packageName,
      purchaseDate: new Date().toISOString().split('T')[0],
      cost: packageRows[0][0].cost,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getPurchasesByEmployer = async (employerId) => {
  const rows = await executeQuery(
    `
    SELECT 
      p.pID,
      p.EmpID,
      p.PackageName,
      p.purchaseDate,
      pk.cost,
      pk.desciption AS description,
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

const getLatestPurchase = async (employerId) => {
  const rows = await executeQuery(
    `
    SELECT 
      p.pID,
      p.EmpID,
      p.PackageName,
      p.purchaseDate,
      pk.cost,
      pk.desciption AS description,
      pk.time
    FROM purchase p
    JOIN package pk ON p.PackageName = pk.PackageName
    WHERE p.EmpID = ?
    ORDER BY p.purchaseDate DESC
    LIMIT 1
  `,
    [employerId],
  );
  return rows[0];
};

module.exports = {
  createPurchase,
  getPurchasesByEmployer,
  getLatestPurchase,
};

