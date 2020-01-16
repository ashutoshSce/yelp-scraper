require('dotenv').config();

const app = require('./app');
const database = require('./database');
const logging = require('./logging');
const pagination = require('./pagination');

const config = {
  app,
  database,
  logging,
  pagination
};

module.exports = config;
