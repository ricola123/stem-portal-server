require('dotenv').config();

// importing the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('morgan');

const routes = require('./routes/index.js');

// defining the Express app
const app = express();
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

const posts = require('../routes/api/posts');
const register = require('../routes/api/register');

app.use('/api', routes(router));

// app.use('/api/posts', posts);
// app.use('/api/register', register);

// starting the server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

//module.exports = app;