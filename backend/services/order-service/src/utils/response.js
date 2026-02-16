function success(res, data) {
  return res.json(data);
}

function error(res, message, status = 400) {
  return res.status(status).json({ error: message });
}

module.exports = { success, error };
