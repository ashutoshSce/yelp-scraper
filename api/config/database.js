module.exports = {
  default: process.env.DB_CONNECTION || 'mongo',
  connections: {
    mongo: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || '27017',
      database: process.env.DB_DATABASE || 'forge',
      username: process.env.DB_USERNAME || 'forge',
      password: process.env.DB_PASSWORD || ''
    }
  }
};
