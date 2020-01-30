const Joi = require('@hapi/joi');
Joi.objectId = require('joi-objectid')(Joi);
const { ResponseError } = require('../utils');

module.exports = {
  checker: {
    params: Joi.object({
      key: Joi.alternatives().try(
        Joi.string().email(),
        Joi.string().min(6).max(20).lowercase().trim()
      )
    })
  },
  register: {
    body: Joi.object({
      username: Joi.string().min(6).max(20).lowercase().trim().required(),
      password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,26}$/).required()
        .error(() => new ResponseError(400, 'password does not contain at least a number or an uppercase letter')),
      email: Joi.string().email().required(),
      resend: Joi.boolean()
    })
  },
  updatePassword: {
    params: Joi.object({ userId: Joi.objectId().required() }),
    body: Joi.object({
      password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,26}$/).required()
        .error(() => new ResponseError(400, 'password does not contain at least a number or an uppercase letter')),
      newPassword: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,26}$/).required()
        .error(() => new ResponseError(400, 'password does not contain at least a number or an uppercase letter'))
    })
  }
}