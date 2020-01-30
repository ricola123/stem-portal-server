const db = require('./database');
const express = require('./express');

module.exports = async expressApp => {
  await Promise.all([ db(), express(expressApp) ]);
};