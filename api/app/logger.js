const { createLogger, transports, format } = require('winston');
require('winston-daily-rotate-file');

const config = require('../config');

const myFormat = format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`);

const loggingConnections = config.logging.default;

function getConsoleLogger(def) {
  return new transports.Console({
    level: def.level,
    format: format.combine(format.timestamp(), format.colorize(), myFormat)
  });
}

function getDailyFileLogger(def) {
  return new transports.DailyRotateFile({
    level: def.level,
    filename: def.path,
    datePattern: 'yyyy-MM-dd.',
    format: format.combine(format.timestamp(), myFormat)
  });
}

function getFileLogger(def) {
  return new transports.File({
    level: def.level,
    filename: def.path,
    format: format.combine(format.timestamp(), myFormat)
  });
}

function getTransport(channelName, def) {
  switch (channelName) {
    case 'console':
      return getConsoleLogger(def);
    case 'single':
      return getFileLogger(def);
    case 'daily':
      return getDailyFileLogger(def);
    default:
      return getConsoleLogger(def);
  }
}

function transport() {
  const transportList = [];
  let def = config.logging.connections[loggingConnections];
  if (loggingConnections === 'stack') {
    config.logging.connections[loggingConnections].channels.forEach(channelName => {
      def = config.logging.connections[channelName];
      transportList.push(getTransport(channelName, def));
    });
  } else {
    transportList.push(getTransport(loggingConnections, def));
  }
  return transportList;
}

const logger = createLogger({
  transports: transport(),
  prettyPrint: true,
  handleExceptions: true,
  exitOnError: false
});

module.exports = logger;
