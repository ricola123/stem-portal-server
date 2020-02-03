const express = require('express');

const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('morgan');

const routes = require('../api');

module.exports = async app => {
  const router = express.Router();

  // adding Helmet to enhance your API's security
  app.use(helmet());

  // using bodyParser to parse JSON bodies into JS objects
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // enabling CORS for all requests
  app.use(cors());

  // adding morgan to log HTTP requests
  app.use(logger('dev'));

  // handle routes
  app.use('/api', routes(router));

  // error handler middleware
  app.use((err, req, res, next) => {
    console.log(err)
    switch (err.name) {
      case 'ValidationError':
      case 'JsonWebTokenError':
        res.status(400).send({ status: 400, error: err.message });
        break;
      case 'ResponseError':
        res.status(err.status).send({ status: err.status, error: err.message });
        break;
      default: //Internal server error
        res.status(500).send({ status: 500, error: 'internal server error' });
        console.log(err);
    }
    next();
  });
};