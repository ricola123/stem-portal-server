const Joi = require('@hapi/joi');
Joi.objectId = require('joi-objectid')(Joi);
const { ResponseError } = require('../utils');

module.exports = {
    getPosts: {
        query: Joi.object({
            search: Joi.string().min(3),
            tags: Joi.string(),
            sort: Joi.string().valid(['latest', 'rating', 'popular']),
            page: Joi.number().min(1),
            size: Joi.number().min(1).max(20)
        })
    }
};