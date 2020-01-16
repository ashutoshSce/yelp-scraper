module.exports = {
  default: process.env.LOG_CHANNEL || 'stack',
  connections: {
    stack: {
      channels: ['console', 'single']
    },
    console: {
      level: 'debug'
    },
    single: {
      path: 'logs/app.log',
      level: 'debug'
    },
    daily: {
      path: 'logs/app.log',
      level: 'debug'
    }
  }
};
