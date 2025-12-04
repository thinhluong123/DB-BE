const packageModel = require('../models/packageModel');

const getAllPackages = async () => {
  const packages = await packageModel.getAllPackages();
  return packages.map((pkg) => ({
    packageName: pkg.PackageName,
    cost: pkg.cost,
    description: pkg.description,
    time: pkg.time,
  }));
};

module.exports = {
  getAllPackages,
};

