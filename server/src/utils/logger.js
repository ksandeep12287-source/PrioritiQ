const logger = {
  info: (msg, data) => console.log(` ${new Date().toISOString()} - ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err || ''),
  warn: (msg, data) => console.warn(` ${new Date().toISOString()} - ${msg}`, data || '')
};

module.exports = logger;