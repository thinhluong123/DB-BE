const { executeQuery } = require('../config/database');

const fetchCategoriesWithJobCount = () =>
  executeQuery(`
    SELECT
      jc.JCName,
      jc.Specialty,
      COUNT(DISTINCT CASE WHEN j.JobStatus IN ('OPEN', 'Active') AND j.ExpireDate >= CURDATE() THEN j.JobID END) AS openPositions
    FROM job_category jc
    LEFT JOIN \`in\` ji ON ji.JCName = jc.JCName
    LEFT JOIN job j ON j.JobID = ji.JobID
    GROUP BY jc.JCName, jc.Specialty
    ORDER BY openPositions DESC, jc.JCName ASC
  `);

module.exports = {
  fetchCategoriesWithJobCount,
};

