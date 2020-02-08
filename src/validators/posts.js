const Joi = require('@hapi/joi');
Joi.objectId = require('joi-objectid')(Joi);
const { ResponseError } = require('../utils');

module.exports = {
    getPosts: {
        query: Joi.object({
            search: Joi.string().min(3).max(26),
            tags: Joi.string(),
            sort: Joi.string().valid('latest', 'rating', 'popular'),
            page: Joi.number().min(1),
            size: Joi.number().min(5).max(20)
        })
    },
    getPost: {
        params: Joi.object({ id: Joi.objectId().required() })
    },
    createPost: {
        body: Joi.object({
            title: Joi.string().max(50).required(),
            content: Joi.string().min(10).required(),
            tags: Joi.array().min(1).max(5).required()
        })
    },
    updatePost: {
        params: Joi.object({ id: Joi.objectId().required() }),
        body: Joi.object({
            title: Joi.string().max(50),
            content: Joi.string().min(10),
            tags: Joi.array().min(1).max(5)
        })
    },
    deletePost: {
        params: Joi.object({ id: Joi.objectId().required() })
    },
    reactPost: {
        body: Joi.object({
            liked: Joi.boolean(),
            disliked: Joi.boolean()
        })
    },
    getComments: {
        params: Joi.object({ id: Joi.objectId().required() }),
        query: Joi.object({
            reply: Joi.objectId(),
            page: Joi.number().min(1),
            size: Joi.number().min(5).max(20)
        })
    },
    createComment: {
        params: Joi.object({ id: Joi.objectId().required() }),
        body: Joi.object({
            content: Joi.string().required(),
            reply: Joi.objectId()
        })
    },
    updateComment: {
        params: Joi.object({
            pid: Joi.objectId().required(),
            cid: Joi.objectId().required()
        }),
        body: Joi.object({ content: Joi.string().required() })
    },
    deleteComment: {
        params: Joi.object({
            pid: Joi.objectId().required(),
            cid: Joi.objectId().required()
        }),
    }
};