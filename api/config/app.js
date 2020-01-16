module.exports = {
  name: process.env.APP_NAME || 'APP',
  env: process.env.APP_ENV || 'production',
  debug: process.env.APP_DEBUG || false,
  url: process.env.APP_URL || 'http://localhost',
  port: process.env.APP_PORT || '3000'
};
