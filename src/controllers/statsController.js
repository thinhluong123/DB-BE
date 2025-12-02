const { getPool } = require('../config/db');
const { success } = require('../utils/response');

// 1. GET /api/stats - thống kê tổng quan cho homepage
async function getGlobalStats(req, res, next) {
  try {
    const pool = getPool();

    const [[jobRow]] = await pool.query(
      "SELECT COUNT(*) AS liveJobs FROM job WHERE JobStatus = 'Active' AND ExpireDate > CURDATE()"
    );
    const [[companyRow]] = await pool.query('SELECT COUNT(*) AS companies FROM company');
    const [[candidateRow]] = await pool.query('SELECT COUNT(*) AS candidates FROM candidate');
    const [[newJobRow]] = await pool.query(
      'SELECT COUNT(*) AS newJobs FROM job WHERE PostDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
    );

    const stats = [
      {
        icon: 'briefcase',
        number: jobRow.liveJobs.toString(),
        label: 'Live Job'
      },
      {
        icon: 'building',
        number: companyRow.companies.toString(),
        label: 'Companies'
      },
      {
        icon: 'users',
        number: candidateRow.candidates.toString(),
        label: 'Candidates'
      },
      {
        icon: 'file',
        number: newJobRow.newJobs.toString(),
        label: 'New Jobs'
      }
    ];

    // Trả trực tiếp mảng cho FE (HomePage, SignIn, SignUp, EmployerLanding ...)
    // để có thể gọi data.map(...) mà không cần data.data
    return res.status(200).json(stats);
  } catch (err) {
    return next(err);
  }
}

// 2. GET /api/categories - danh mục nghề nghiệp
async function getCategories(req, res, next) {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT 
        JCName as name,
        Specialty as speciality
      FROM job_category`
    );

    // Map đơn giản sang format FE mong muốn
    const categories = rows.map((row, index) => ({
      id: index + 1,
      icon: 'code',
      name: row.name,
      openPositions: 0
    }));

    // FE đang gọi: const data = await response.json(); setCategories(data);
    // nên cần trả về trực tiếp 1 mảng category
    return res.status(200).json(categories);
  } catch (err) {
    return next(err);
  }
}

// 3. GET /api/companies/top - công ty nổi bật (mock logic đơn giản)
async function getTopCompanies(req, res, next) {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT 
        CompanyID,
        CName as CompanyName,
        Logo,
        CompanySize,
        Website,
        Description,
        Industry,
        CNationality
      FROM company
      LIMIT 10`
    );

    const companies = rows.map((c) => ({
      CompanyID: c.CompanyID,
      CompanyName: c.CompanyName,
      Logo: c.Logo,
      CompanySize: c.CompanySize,
      Website: c.Website,
      Description: c.Description,
      Industry: c.Industry,
      CNationality: c.CNationality,
      openPositions: 0,
      rating: 4.5
    }));

    // HomePage fetch(`${API_BASE_URL}/companies/top`) và setTopCompanies(data)
    // nên API này cũng trả về trực tiếp mảng company
    return res.status(200).json(companies);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getGlobalStats,
  getCategories,
  getTopCompanies
};


