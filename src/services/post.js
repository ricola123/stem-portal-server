const Post = require('../models/posts');

const TagService = require('../services/tag');
const { ResponseError } = require('../utils');

const mongoose = require('mongoose');
const _ = require('lodash');

class PostService {

    async getPosts (paginator) {
        const { query, sort, page, size } = paginator;
        const posts = await Post.find(query)
            .select('title author tags rating updatedAt')
            .sort(sort)
            .skip((size * page) - size)
            .limit(size)
            .populate('author', 'username')
            .lean();
        return { posts, page };
    }

    async getPost (_postId, user, nComments) {
        const post = await Post.findById(_postId, { comments: { $slice: nComments } })
            .populate('author', 'username type email school')
            .populate('comments.author', 'username')
            .select('tags nLikes nDislikes author title content createdAt updatedAt')
            .select('comments._id comments.author comments.content comments.nLikes comments.nDislikes comments.nReplies comments.updatedAt comments.createdAt')
            .lean();

        if (user && post.likes.includes(user.id)) post.liked = true;
        else if (user && post.dislikes.includes(user.id)) post.disliked = true;
        
        delete post.likes;
        delete post.dislikes;
        return post;
    }

    async createPost (author, title, content, tags) {
        const post = new Post({ author: author.id, title, content, tags });
        await Promise.all([
            TagService.updatePostTags(post._id, tags),
            post.save()
        ]);
        return { _id: post._id, author: post.author, title, content, tags };
    }

    async updatePost (updator, _postId, updates) {
        const post = await Post.findById(_postId);
        if (!post) throw new ResponseError(404, 'post not found');
        if (!updator.id.equals(post.author)) throw new ResponseError(403, 'only authors can update their own posts');

        post.set(updates);
        if (updates.tags) {
            await Promise.all([
                TagService.updatePostTags(_postId, updates.tags),
                post.save()
            ]);
        } else {
            await post.save();
        }
    }

    async deletePost (deletor, _postId) {
        const post = await Post.findById(_postId);
        if (!post) throw new ResponseError(404, 'post not found');
        if (!deletor.id.equals(post.author)) throw new ResponseError(403, 'only authors can delete their own posts');

        await Promise.all([
            Post.deleteOne({ _id: _postId }),
            TagService.deRegisterPostTags(_postId)
        ]);
    }

    async reactPost (rater, _postId, liked, disliked) {
        const post = await Post.findById(_postId);
        if (!post) throw new ResponseError(404, 'post not found');

        if (liked) {
            if (!post.likes.includes(rater.id)) {
                post.likes.push(rater.id);
                // after like, remove potential dislike
                if (post.dislikes.includes(rater.id)) {
                    this.deleteInPlace(post.dislikes, rater.id, false);
                }
            }
        } else if (liked !== undefined) { //user reverts like
            if (post.likes.includes(rater.id)) {
                this.deleteInPlace(post.likes, rater.id);
            }
        }
        if (disliked) {
            if (!post.dislikes.includes(rater.id)) {
                post.dislikes.push(rater.id);
                // after dislike, remove potential like
                if (post.likes.includes(rater.id)) {
                    this.deleteInPlace(post.likes, rater.id, false);
                }
            }
        } else if (disliked !== undefined) { //user reverts dislike
            if (post.dislikes.includes(rater.id)) {
                this.deleteInPlace(post.dislikes, rater.id);
            }
        }
        post.nLikes = post.likes.length;
        post.nDislikes = post.dislikes.length;
        post.rating = post.nLikes - post.nDislikes;
        await post.save();
    }

    async getComments (_postId, reply, page, size) {
        const baseStages = this.getCommentsAggrStages(_postId, reply, page, size);
        const [comments, [{ count }]] = await Promise.all([
            Post.aggregate(reply ? [
                ...baseStages,
                { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
                { $unwind: '$author' },
                { $project: { author: { _id: 1, username: 1 }, content: 1, nLikes: 1, nDislikes: 1, nComments: 1, updatedAt: 1, createdAt: 1 } }
            ] : [
                ...baseStages,
                { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
                { $unwind: '$author' },
                { $lookup: { from: 'posts', localField: 'parent', foreignField: 'comments._id', as: 'post' } },
                { $set: { _parentId: '$parent' } },
                { $set: { parent: '$post' } },
                { $project: { parent: { comments: { _id: 1, content: 1 } }, author: { _id: 1, username: 1 }, _parentId: 1, content: 1, nLikes: 1, nDislikes: 1, nComments: 1, updatedAt: 1, createdAt: 1 } },
                { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } },
                { $unwind: { path: '$parent.comments', preserveNullAndEmptyArrays: true } },
                { $match: { $expr: { $eq: [ '$parent.comments._id', '$_parentId' ] } } },
                { $project: { parent: { _id: '$_parentId', content: '$parent.comments.content' }, author: { _id: 1, username: 1 }, content: 1, nLikes: 1, nDislikes: 1, nComments: 1, updatedAt: 1, createdAt: 1 } }
            ]),
            Post.aggregate([ ...baseStages, { $count: 'count' } ])
        ]);
        comments.forEach(c => { if (_.isEmpty(c.parent)) delete c.parent } );
        return { comments, pages: Math.ceil(count / size) || 1 };
    }

    async createComment (_postId, author, content, _parentId) {
        const post = await Post.findById(_postId).select('comments');
        if (!post) throw new ResponseError(404, 'post not found');

        if (_parentId) {
            const parent = post.comments.id(_parentId);
            if (!parent) throw new ResponseError(404, 'reply target not found');
            if (parent.parent) _parentId = parent.parent;
        }

        const _commentId = mongoose.Types.ObjectId();
        const comment = { _id: _commentId, author: author.id, parent: _parentId, content };

        const postComment = () => Post.updateOne({ _id: _postId }, { 
            $push: { comments: comment },
            $inc: { nComments: 1 }
        });
        const updateParent = () => Post.updateOne({ _id: _postId, 'comments._id': _parentId }, {
            $push: { 'comments.$.comments': mongoose.Types.ObjectId(_commentId) },
            $inc: { 'comments.$.nComments': 1 }
        });

        const result = await (_parentId ? Promise.all([postComment(), updateParent()]) : postComment());
        const success = result.nModified || Array.isArray(result) && result.every(r => !!r.nModified);
        if (!success) throw new ResponseError(400, 'failed to create comment');

        return (await Post.aggregate([
            ...this.getCommentsAggrStages(_postId),
            { $match: { _id: mongoose.Types.ObjectId(_commentId) } },
            { $project: { author: 1, content: 1, parent: 1, nLikes: 1, nDislikes: 1, nComments: 1 } }
        ]))[0]; //Aggregation returns an array
    }

    async updateComment (_postId, _commentId, updator, content) {
        const post = await Post.findById(_postId, { comments: 1 });
        if (!post) throw new ResponseError(404, 'post not found');


        const comment = post.comments.id(_commentId);
        if (!comment) throw new ResponseError(404, 'comment not found');
        if (!updator.id.equals(comment.author)) throw new ResponseError(403, 'only the author can update this comment');
        if (comment.content === content) return;

        await Post.updateOne({ _id: _postId, 'comments._id': _commentId }, {
            $set: { 'comments.$.content': content }
        });
    }

    async deleteComment (_postId, _commentId, deletor) {
        const post = await Post.findById(_postId, { comments: 1 });
        if (!post) throw new ResponseError(404, 'post not found');

        const comment = post.comments.id(_commentId);
        if (!comment) throw new ResponseError(404, 'comment not found');
        if (!deletor.id.equals(comment.author)) throw new ResponseError(403, 'only the author can delete this comment');
        
        const deleteComment = () => Post.updateOne({ _id: _postId }, {
            $pull: { comments: { _id: _commentId } },
            $inc: { nComments: -1 }
        });
        const updateParent = () => Post.updateOne({ _id: _postId, 'comments._id': comment.parent }, {
            $pull: { 'comments.$.comments': _commentId },
            $inc: { 'comments.$.nComments': -1 }
        });
        await (comment.parent ? Promise.all([deleteComment(), updateParent()]) : deleteComment());
    }
    
    getCommentsAggrStages (_postId, reply, page, size) {
        const pre = [
            { $match: { _id: mongoose.Types.ObjectId(_postId) } },
            { $project: { comments: 1 } },
            { $unwind: '$comments' }
        ];
        if (reply) pre.push({ $match: { 'comments.parent': mongoose.Types.ObjectId(reply) } });
        const post = !!page && !!size ? [
            { $skip: (page - 1) * size },
            { $limit: size }
        ] : [];
        return [ ...pre, { $replaceWith: '$comments' }, ...post ];
    }

    findComment (comments, _commentId) {
        for (let i = 0; i < comments.length; i++) {
            const comment = comments[i];
            if (comment._id.equals(_commentId)) return { comment };
            if (comment.nComments) {
                for (let j = 0; j < comment.comments.length; j++) {
                    if (comment.comments[j]._id.equals(_commentId)) {
                        return { comment: comment.comments[j], parent: comment._id };
                    }
                }
            }
        }
    }

    deleteInPlace (arr, condition, shouldBreak = true) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].equals(condition)) {
                arr.splice(i, 1);
                if (shouldBreak) break;
            }
        }
    }
}

module.exports = new PostService();