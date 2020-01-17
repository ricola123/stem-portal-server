const Joi = require('@hapi/joi');
const StatusCodeError = require('../middleware/errors').StatusCodeError;

module.exports = Joi.object({
  username: Joi.string().min(6).max(20).lowercase().trim().required(),
  password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,26}$/).required()
    .error(() => new StatusCodeError(400, 'password does not contain at least a number or an uppercase letter'))
});