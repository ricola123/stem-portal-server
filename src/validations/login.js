const Joi = require('@hapi/joi');
const RequestError = require('../middleware/errors').RequestError;

module.exports = Joi.object({
  username: Joi.string().min(6).max(20).lowercase().trim().required(),
  password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,26}$/).required()
    .error(() => new RequestError(400, 'password does not contain at least a number or an uppercase letter'))
});