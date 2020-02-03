const Joi = require('@hapi/joi');
Joi.objectId = require('joi-objectid')(Joi);
const { ResponseError } = require('../utils');

module.exports = {
    getPosts: {
        query: Joi.object({
            search: Joi.string().min(3),
            tags: Joi.string(),
            sort: Joi.string().valid('latest', 'rating', 'popular'),
            page: Joi.number().min(1),
            size: Joi.number().min(1).max(20)
        })
    },
    createPost: {
        body: Joi.object({
            title: Joi.string().max(50).required(),
            content: Joi.string().required(),
            tags: Joi.array().min(1).max(5).required()
        })
    }
};