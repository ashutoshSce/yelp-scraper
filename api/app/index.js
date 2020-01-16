const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

require('./models');
const router = require('../routes');

const app = express();

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/v1', router);

module.exports = app;
