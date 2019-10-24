// ./src/index.js

// importing the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// defining the Express app
const app = express();

// defining an array to work as the database (temporary solution)
const ads = [
  {title: 'Hello, world (again)!'},
  {name: 'Chris Chan'}
];

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

/*
// defining an endpoint to return all ads
app.get('/', (req, res) => {
  res.send(ads);
});
*/

const posts = require('./routes/api/posts');
const register = require('./routes/api/register');

app.use('/api/posts', posts);
app.use('/api/register', register);


// starting the server
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});