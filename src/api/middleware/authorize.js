const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { ResponseError } = require('../../utils');

const exceptions = new Set(['any', 'optional', 'admin']);

module.exports = (role = 'any') => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1]; // Bearer <token>
      const options = { expiresIn: '2d', issuer: 'https://www.stem-portal.hk' };
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET, options);
        if (role !== user.type && !exceptions.has(role)) throw new ResponseError(403, 'forbidden');
        user.id = mongoose.Types.ObjectId(user.id); // convert string to user id
        req.user = user;
        next();
      } catch (err) {
        if (role === 'optional') return next();
        throw err;
      }
    } else {
      if (role === 'optional') return next();
      throw new ResponseError(401, 'authentication token required');
    }
  }
};