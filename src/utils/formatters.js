const dayjs = require('dayjs');

const formatCurrencyRange = (from, to) => {
  if (from == null && to == null) return 'Thỏa thuận';
  if (from != null && to != null) return `${Number(from).toLocaleString('vi-VN')} - ${Number(to).toLocaleString('vi-VN')}`;
  if (from != null) return `Từ ${Number(from).toLocaleString('vi-VN')}`;
  return `Đến ${Number(to).toLocaleString('vi-VN')}`;
};

const formatDate = (value) => {
  if (!value) return null;
  return dayjs(value).toISOString();
};

const buildJobStatistics = (totalApplications = 0, approved = 0, declined = 0) => [
  { label: 'Total Applications', number: `${totalApplications}` },
  { label: 'Approved Applications', number: `${approved}` },
  { label: 'Declined Applications', number: `${declined}` },
];

module.exports = {
  formatCurrencyRange,
  formatDate,
  buildJobStatistics,
};

