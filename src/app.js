require('dotenv').config();
require('express-async-errors');

const express = require('express');
const app = express();

// load all components
(async () => await require('./loaders')(app))();

// starting the server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

module.exports = app;