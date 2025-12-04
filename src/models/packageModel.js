const { executeQuery } = require('../config/database');

const getAllPackages = async () => {
  const rows = await executeQuery(
    `
    SELECT 
      PackageName,
      cost,
      desciption AS description,
      time
    FROM package
    ORDER BY cost ASC
  `,
  );
  return rows;
};

const getPackageByName = async (packageName) => {
  const rows = await executeQuery(
    `
    SELECT 
      PackageName,
      cost,
      desciption AS description,
      time
    FROM package
    WHERE PackageName = ?
  `,
    [packageName],
  );
  return rows[0];
};

module.exports = {
  getAllPackages,
  getPackageByName,
};

