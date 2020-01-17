const RequestError = require('../middleware/errors').RequestError;

module.exports = {
  validateInput: (schema, property = 'body') => {
    return async (req, res, next) => {
      await schema.validateAsync(req[property]);
      next();
    };
  },
  validateRole: (role = 'any') => {
    return (req, res, next) => {
      const authorizationHeaader = req.headers.authorization;
      if (authorizationHeaader) {
        const token = authorizationHeaader.split(' ')[1]; // Bearer <token>
        const options = { expiresIn: '2d', issuer: 'https://www.stem-portal.hk' };
        try {
          const user = jwt.verify(token, process.env.JWT_SECRET, options);
          if (role !== 'any' && role !== user.type) throw new RequestError(403, 'Forbidden');
          req.decoded = user;
          next();
        } catch (err) {
          throw err;
        }
      } else {
        throw new RequestError(401, 'Authentication token required');
      }
    }
  }
}