const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { ResponseError } = require('../../utils');

module.exports = (role = 'any') => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1]; // Bearer <token>
      const options = { expiresIn: '2d', issuer: 'https://www.stem-portal.hk' };
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET, options);
        if (role !== 'any' && role !== user.type) throw new ResponseError(403, 'forbidden');
        user.id = mongoose.Types.ObjectId(user.id); // convert string to user id
        req.decoded = user;
        next();
      } catch (err) {
        throw err;
      }
    } else {
      throw new ResponseError(401, 'authentication token required');
    }
  }
};