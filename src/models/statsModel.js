const { executeQuery } = require('../config/database');

const fetchSystemCounts = async () => {
  const rows = await executeQuery(`
    SELECT
      (SELECT COUNT(*) FROM job WHERE JobStatus IN ('OPEN', 'Active') AND ExpireDate >= CURDATE()) AS liveJobs,
      (SELECT COUNT(*) FROM company) AS companies,
      (SELECT COUNT(*) FROM candidate) AS candidates,
      (SELECT COUNT(*) FROM job WHERE PostDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) AS newJobs,
      (SELECT COUNT(*) FROM apply) AS successfulHires
  `);
  return rows[0] || {};
};

module.exports = {
  fetchSystemCounts,
};

