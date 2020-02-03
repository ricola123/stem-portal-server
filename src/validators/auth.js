const Joi = require('@hapi/joi');
Joi.objectId = require('joi-objectid')(Joi);
const { ResponseError } = require('../utils');

module.exports = {
  verify: {
    params: Joi.object({ username: Joi.string().min(6).max(20).lowercase().required() }),
    body: Joi.object({
      token: Joi.string().length(32).required(),
      cancel: Joi.boolean()
    })
  },
  activate: {
    params: Joi.object({ username: Joi.string().min(6).max(20).lowercase().required() }),
    body: Joi.object({
      role: Joi.string().valid('student', 'teacher', 'parent').required(),
      firstName: Joi.string().max(20).pattern(/^([^0-9]*)$/).required(),
      lastName: Joi.string().max(20).pattern(/^([^0-9]*)$/).required(),
      gender: Joi.string().valid('male', 'female', 'others').required(),
      school: Joi.string().min(6).max(50).pattern(/^([^0-9]*)$/).required(),
      interests: Joi.array().min(1).max(10).required()
    })
  },
  login: {
    body: Joi.object({
      username: Joi.string().min(6).max(20).lowercase().trim().required(),
      password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,26}$/).required()
        .error(() => new ResponseError(400, 'password does not contain at least a number or an uppercase letter'))
    })
  },
  forgotPassword: {
    body: Joi.object({
      username: Joi.string().min(6).max(20).lowercase().trim().required(),
      email: Joi.string().email().required()
    })
  },
  cancelToken: {
    params: Joi.object({
      token: Joi.string().length(32).required(),
    }),
    body: Joi.object({
      username: Joi.string().min(6).max(20).lowercase().trim().required()
    })
  },
  resetPassword: {
    body: Joi.object({
      username: Joi.string().min(6).max(20).lowercase().required(),
      password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,26}$/).required()
        .error(() => new ResponseError(400, 'password does not contain at least a number or an uppercase letter')),
      token: Joi.string().length(32).required()
    })
  }
}