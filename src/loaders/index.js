const { gfs } = require('./database');
const express = require('./express');

module.exports = async expressApp => {
  await Promise.all([ gfs, express(expressApp) ]);
};