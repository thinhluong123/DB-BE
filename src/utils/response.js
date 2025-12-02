function success(res, data = null, message = 'OK', status = 200) {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
}

function fail(res, message = 'Bad request', status = 400, errors = null) {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
}

module.exports = {
  success,
  fail
};


