const jwt = require('jsonwebtoken');

const { ResponseError } = require('../../utils');

module.exports = schema => {
  return async (req, res, next) => {
    const promises = Object.keys(schema).map(key => schema[key].validateAsync(req[key]));
    await Promise.all(promises);
    next();
  };
}