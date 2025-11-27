const statsModel = require('../models/statsModel');
const categoryModel = require('../models/categoryModel');
const companyModel = require('../models/companyModel');

const formatNumber = (value) => Number(value || 0).toLocaleString('en-US');

const STAT_TILES = [
  { key: 'liveJobs', icon: 'briefcase', label: 'Live Job' },
  { key: 'companies', icon: 'building', label: 'Companies' },
  { key: 'candidates', icon: 'users', label: 'Candidates' },
  { key: 'newJobs', icon: 'file', label: 'New Jobs' },
  { key: 'successfulHires', icon: 'check-circle', label: 'Successful Hires' },
];

const CATEGORY_ICON_MAP = {
  'Software Engineering': 'code',
  'Frontend Developer': 'layout',
  'Backend Developer': 'server',
  'Mobile Developer': 'smartphone',
  'DevOps Engineer': 'gitbranch',
  'QA / Tester': 'bug',
  'QA Tester': 'bug',
  'UI/UX Designer': 'palette',
  'AI / Machine Learning': 'cpu',
};

const getHomepageStats = async () => {
  const stats = await statsModel.fetchSystemCounts();
  return STAT_TILES.map((tile) => ({
    icon: tile.icon,
    number: formatNumber(stats?.[tile.key]),
    label: tile.label,
  }));
};

const getJobCategories = async () => {
  const categories = await categoryModel.fetchCategoriesWithJobCount();
  return categories.map((category, index) => ({
    id: index + 1,
    icon: CATEGORY_ICON_MAP[category.JCName] || 'briefcase',
    name: category.JCName,
    openPositions: Number(category.openPositions) || 0,
    specialty: category.Specialty,
  }));
};

const getTopCompanies = async (limit = 8) => {
  const companies = await companyModel.fetchTopCompanies(limit);
  return companies.map((company) => ({
    CompanyID: company.CompanyID,
    CompanyName: company.CompanyName,
    Logo: company.Logo,
    CompanySize: company.CompanySize ? `${company.CompanySize.toLocaleString('en-US')} employees` : null,
    Website: company.Website,
    Description: company.Description,
    Industry: company.Industry,
    CNationality: company.CNationality,
    openPositions: Number(company.openPositions) || 0,
    rating: company.rating ? Number(company.rating) : null,
  }));
};

module.exports = {
  getHomepageStats,
  getJobCategories,
  getTopCompanies,
};

