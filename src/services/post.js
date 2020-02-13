const Post = require('../models/posts');

const TagService = require('../services/tag');
const { ResponseError } = require('../utils');

const mongoose = require('mongoose');
const _ = require('lodash');

class PostService {

    async getPosts (paginator) {
        const { query, sort, page, size } = paginator;
        const posts = await Post.find(query)
            .select('title author tags rating nComments updatedAt')
            .sort(sort)
            .skip((page - 1) * size)
            .limit(size)
            .populate('author', 'username')
            .lean();
        return { posts, page };
    }

    async getPost (_postId, user, size) {
        const post = await Post.findById(_postId, { comments: { $slice: size } })
            .populate('author', 'username type email school')
            .populate('comments.author', 'username')
            .select('tags nLikes nDislikes author title content createdAt updatedAt nComments')
            .select('comments._id comments.author comments.content comments.nLikes comments.nDislikes comments.nComments comments.updatedAt comments.createdAt')
            .lean();
        if (!post) throw new ResponseError(404, 'post not found');

        if (user && post.likes.includes(user.id)) post.liked = true;
        else if (user && post.dislikes.includes(user.id)) post.disliked = true;

        post.floor = 1;
        post.comments.forEach((c, i) => c.floor = i + 2);
        
        delete post.likes;
        delete post.dislikes;

        return { post, pages: Math.ceil(post.nComments / size) || 1 };
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

    async getComments (_postId, _replyId, page, size) {
        const post = await Post.findById(_postId)
            .select('-_id comments._id comments.parent');
        if (!post) throw new ResponseError(404, 'post not found');

        let comments = [], count = 0, parent;
        if (!_replyId) {
            count = post.comments.length;
            comments = await this._getPagedComments(_postId, page, size);
        } else {
            const reply = post.comments.id(_replyId);
            if (!reply) throw new ResponseError(404, 'reply target not found');

            _replyId = mongoose.Types.ObjectId(_replyId);
            const _parentId = reply.parent;

            let skip = 0;
            for (let i = 0; i < post.comments.length; i++) {
                const c = post.comments[i];
                if (!page && c._id.equals(_replyId)) skip = i;
                if (c.parent && c.parent.equals(_parentId)) count += 1;
            }

            page = page || Math.ceil(skip / size);
            ([{ parent, comments }] = await this._getPagedReplyComments(_postId, _parentId, _replyId, page, size));
        }
        comments.forEach(c => { if (_.isEmpty(c.parent)) delete c.parent } );
        return {
            page: parseInt(page) || 1, 
            pages: Math.ceil(count / size) || 1,
            parent,
            comments
        }
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
            $push: { 'comments.$.comments': _commentId },
            $inc: { 'comments.$.nComments': 1 }
        });

        const result = await (_parentId ? Promise.all([postComment(), updateParent()]) : postComment());
        const success = result.nModified || Array.isArray(result) && result.every(r => !!r.nModified);
        if (!success) throw new ResponseError(400, 'failed to create comment');

        return (await Post.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(_postId) } },
            { $project: { _id: 0, comments: 1 } },
            { $unwind: { path: '$comments', includeArrayIndex: 'comments.floor' } },
            { $match: { 'comments._id': _commentId } },
            { $replaceRoot: { newRoot: '$comments' } },
            { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
            { $unwind: '$author' },
            { $project: { floor: { $add: [ '$floor', 2 ] }, author: { _id: 1, username: 1 }, content: 1, parent: 1, nLikes: 1, nDislikes: 1, nComments: 1 } }
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
        const post = await Post.findById(_postId)
            .select('comments._id comments.comments comments.author');
        if (!post) throw new ResponseError(404, 'post not found');

        const comment = post.comments.id(_commentId);
        if (!comment) throw new ResponseError(404, 'comment not found');
        if (!deletor.id.equals(comment.author)) throw new ResponseError(403, 'only the author can delete this comment');
        
        const deleteIds = [_commentId, ...comment.comments];
        const deleteComment = () => Post.updateOne({ _id: _postId }, {
            $pull: { comments: { _id: { $in: deleteIds } } },
            $inc: { nComments: -1 * deleteIds.length }
        });
        const updateParent = () => Post.updateOne({ _id: _postId, 'comments._id': comment.parent }, {
            $pull: { 'comments.$.comments': _commentId },
            $inc: { 'comments.$.nComments': -1 }
        });
        await (comment.parent ? Promise.all([deleteComment(), updateParent()]) : deleteComment());
    }

    _getPagedReplyComments (_postId, _parentId, _replyId, page, size) {
        return Post.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(_postId) } },
            { $project: { _id: 0, comments: 1 } },
            { $unwind: { path: '$comments', includeArrayIndex: 'comments.floor' } },
            {  
                $facet: {
                    parent: [
                        { $match: { 'comments._id': _parentId || _replyId } },
                        { $replaceRoot: { newRoot: '$comments' } },
                        { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
                        { $unwind: '$author' },
                        { $project: { author: { _id: 1, username: 1 }, floor: { $add: [ '$floor', 2 ] }, _parentId: 1, content: 1, nLikes: 1, nDislikes: 1, nComments: 1, updatedAt: 1, createdAt: 1 } }
                    ],
                    comments: [
                        { $match: { 'comments.parent': _parentId || _replyId } },
                        { $skip: (page - 1) * size },
                        { $limit: size },
                        { $replaceRoot: { newRoot: '$comments' } },
                        { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
                        { $unwind: '$author' },
                        { $project: { author: { _id: 1, username: 1 }, floor: { $add: [ '$floor', 2 ] }, _parentId: 1, content: 1, nLikes: 1, nDislikes: 1, nComments: 1, updatedAt: 1, createdAt: 1 } }
                    ]
                }
            },
            { $unwind: '$parent' }
        ]);
    }

    _getPagedComments (_postId, page = 1, size) {
        return Post.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(_postId) } },
            { $project: { _id: 0, comments: 1 } },
            { $unwind: { path: '$comments', includeArrayIndex: 'comments.floor' } },
            { $skip: (page - 1) * size },
            { $limit: size },
            { $replaceRoot: { newRoot: '$comments' } },
            { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
            { $unwind: '$author' },
            { $lookup: { from: 'posts', localField: 'parent', foreignField: 'comments._id', as: 'post' } },
            { $unwind: { path: '$post', preserveNullAndEmptyArrays: true } },
            { $addFields: { _parentId: '$parent', parent: '$post.comments' } },
            { $project: { parent: { _id: 1, content: 1 }, author: { _id: 1, username: 1 }, floor: { $add: [ '$floor', 2 ] }, _parentId: 1, content: 1, nLikes: 1, nDislikes: 1, nComments: 1, updatedAt: 1, createdAt: 1 } },
            { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } },
            { $match: { $expr: { $eq: [ '$parent._id', '$_parentId' ] } } },
            { $unset: '_parentId' }
        ]);
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