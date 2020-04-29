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
      sort: Joi.string().valid('latest', 'rating', 'popular'),
      page: Joi.number().min(1),
      size: Joi.number().min(1).max(20)
    })
  },
  getInProgressCourses: {
    query: Joi.object({
      search: Joi.string().min(3),
      tags: Joi.string(),
      page: Joi.number().min(1),
      size: Joi.number().min(1).max(20)
    })
  },
  getTeachingCourses: {
    query: Joi.object({
      search: Joi.string().min(3),
      tags: Joi.string(),
      page: Joi.number().min(1),
      size: Joi.number().min(1).max(20)
    })
  },
  getFinishedCourses: {
    query: Joi.object({
      search: Joi.string().min(3),
      tags: Joi.string(),
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
      chapters: Joi.array().required()
    })
  },
  updateCourse: {
    params: Joi.object({ id: Joi.objectId().required() }),
    body: Joi.object({
      name: Joi.string().min(10).max(60).required(),
      description: Joi.string().required(),
      tags: Joi.array().min(1).max(5).required(),
      chapters: Joi.array().required()
    })
  },
  publishCourse: {
    params: Joi.object({ id: Joi.objectId().required() })
  },
  unpublishCourse: {
    params: Joi.object({ id: Joi.objectId().required() })
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