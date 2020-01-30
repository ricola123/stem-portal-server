const Joi = require('@hapi/joi');
Joi.objectId = require('joi-objectid')(Joi);
const { ResponseError } = require('../utils');

module.exports = {
  checker: {
    params: Joi.object({
      name: Joi.string().min(10).max(60).required()
    })
  },
  getCourses: {
    query: Joi.object({
      search: Joi.string().min(3),
      tags: Joi.string(),
      sort: Joi.string(),
      page: Joi.number().min(1),
      size: Joi.number().min(1).max(20)
    })
  },
  getCourse: {
    params: Joi.object({
      id: Joi.objectId().required()
    })
  },
  createCourse: {
    body: Joi.object({
      name: Joi.string().min(10).max(60).required(),
      description: Joi.string().required(),
      tags: Joi.array().min(1).max(5).required(),
      chapters: Joi.string()
    })
  },
  updateCourse: {
    params: Joi.object({ id: Joi.objectId().required() }),
    body: Joi.object({
      name: Joi.string().min(10).max(60).required(),
      description: Joi.string().required(),
      tags: Joi.array().min(1).max(5).required(),
      chapters: Joi.string()
    })
  },
  deleteCourse: {
    params: Joi.object({ id: Joi.objectId().required() })
  },
  rateCourse: {
    params: Joi.object({ id: Joi.objectId().required() }),
    body: Joi.object({
      score: Joi.number().precision(1).min(1).max(5).required(),
      comment: Joi.string()
    })
  }
};