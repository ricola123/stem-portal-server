const Post = require('../models/posts');

const UserService = require('../services/user')
const TagService = require('../services/tag');
const { ResponseError } = require('../utils');

const mongoose = require('mongoose');
const _ = require('lodash');
const sanitize = require('sanitize-html');

class PostService {

    async getPosts (paginator) {
        const { query, sort, page, size } = paginator;
        const posts = await Post.find(query)
            .select('title author tags rating nComments updatedAt')
            .sort(sort)
            .skip((page - 1) * size)
            .limit(size)
            .populate('author', 'username type')
            .lean();
        return { posts, page };
    }

    async getPost (_postId, _userId, size) {
        const [post] = await this._getPost(_postId, _userId, parseInt(size));
        if (!post) throw new ResponseError(404, 'post not found');

        return { post, pages: Math.ceil(post.nComments / size) || 1 };
    }

    async createPost (author, title, content, tags) {
        const post = new Post({ author: author.id, title, content: sanitize(content), tags });
        await Promise.all([
            TagService.updatePostTags(post._id, tags),
            post.save(),
            UserService.updateMeterEXP(author.id, 'createPost')
        ]);
        return { _id: post._id, author: post.author, title, content, tags };
    }

    async updatePost (updator, _postId, updates) {
        const post = await Post.findById(_postId)
            .select('title content tags author');
        if (!post) throw new ResponseError(404, 'post not found');
        if (!updator.id.equals(post.author)) throw new ResponseError(403, 'only authors can update their own posts');

        if (updates.content) updates.content = sanitize(update.content);
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
            TagService.deRegisterPostTags(_postId, post.tags)
        ]);
    }

    async reactPost (_userId, _postId, liked, disliked) {
        if (liked && disliked) throw new ResponseError(400, 'cannot like and dislike post at the same time');
        await Post.updateOne({ _id: _postId }, [
            { $set: {
                likes: { [liked ? '$setUnion' : '$setDifference']: [ '$likes', [ _userId ] ] },
                dislikes: { [disliked ? '$setUnion' : '$setDifference']: [ '$dislikes', [ _userId ] ] },
            } },
            { $set: { nLikes: { $size: '$likes' }, nDislikes: { $size: '$dislikes' } } },
            { $set: { rating: { $subtract: [ '$nLikes', '$nDislikes' ] } } }
        ]);
    }

    async getComments (_postId, _userId, _replyId, page, size) {
        const post = await Post.findById(_postId)
            .select('-_id comments._id comments.parent');
        if (!post) throw new ResponseError(404, 'post not found');

        let comments = [], count = 0, parent;
        if (!_replyId) {
            count = post.comments.length;
            page = parseInt(page) || 1;
            comments = await this._getPagedComments(_postId, _userId, undefined, page, size);

        } else {
            _replyId = mongoose.Types.ObjectId(_replyId);
            const reply = post.comments.id(_replyId);
            if (!reply) throw new ResponseError(404, 'reply target not found');

            const _commentId = reply.parent || _replyId;

            let skip = 0;
            for (let i = 0; i < post.comments.length; i++) {
                const c = post.comments[i];
                if (!page && c._id.equals(_replyId)) skip = count;
                if (c.parent && c.parent.equals(_commentId)) count += 1;
            }

            page = parseInt(page) || Math.floor(skip / size) + 1;
            ([{ parent, comments }] = await this._getPagedComments(_postId, _userId, _commentId, page, size));
        }

        comments.forEach(c => { if (_.isEmpty(c.parent)) delete c.parent } );
        return { parent, comments, page, pages: Math.ceil(count / size) || 1 };
    }

    async createComment (_postId, _userId, content, _parentId) {
        const post = await Post.findById(_postId)
          .select('comments._id comments.parent');
        if (!post) throw new ResponseError(404, 'post not found');

        if (_parentId) {
            const parent = post.comments.id(_parentId);
            if (!parent) throw new ResponseError(404, 'reply target not found');
            if (parent.parent) _parentId = parent.parent;
        }

        const _commentId = mongoose.Types.ObjectId();
        const comment = { _id: _commentId, author: _userId, parent: _parentId, content: sanitize(content) };

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

        UserService.updateMeterEXP(_userId, 'replyPost');

        return (await Post.aggregate([
            ...this._base(mongoose.Types.ObjectId(_postId)),
            { $match: { 'comments._id': _commentId } },
            { $replaceRoot: { newRoot: '$comments' } },
            ...this._handleReactions(_userId),
            ...this._lookupAuthor(),
            ...this._lookupParent(),
            ...this._projectComment(true)
        ]))[0]; //Aggregation returns an array
    }

    async updateComment (_postId, _commentId, updator, content) {
        const post = await Post.findById(_postId)
            .select('comments._id comments.author comments.content');
        if (!post) throw new ResponseError(404, 'post not found');

        const comment = post.comments.id(_commentId);
        if (!comment) throw new ResponseError(404, 'comment not found');
        if (!updator.id.equals(comment.author)) throw new ResponseError(403, 'only the author can update this comment');

        content = sanitize(content);
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

    async reactComment (_userId, _postId, _commentId, liked, disliked) {
        if (liked && disliked) throw new ResponseError(400, 'cannot like and dislike comment at the same time');

        const operations = { $addToSet: {}, $pull: {} };
        operations[liked ? '$addToSet' : '$pull']['comments.$.likes'] = _userId;
        operations[disliked ? '$addToSet' : '$pull']['comments.$.dislikes'] = _userId;

        await Post.updateOne({ _id: _postId, 'comments._id': _commentId }, operations);
    }

    _getPagedComments (_postId, _userId, _commentId, page, size) {
        return _commentId
        ? Post.aggregate([
            ...this._base(mongoose.Types.ObjectId(_postId)),
            {
                $facet: {
                    parent: [
                        { $match: { 'comments._id': _commentId } },
                        { $replaceRoot: { newRoot: '$comments' } },
                        ...this._handleReactions(_userId),
                        ...this._lookupAuthor(),
                        ...this._projectComment(false)
                    ],
                    comments: [
                        { $match: { 'comments.parent': _commentId } },
                        ...this._paginate(page, size),
                        { $replaceRoot: { newRoot: '$comments' } },
                        ...this._handleReactions(_userId),
                        ...this._lookupAuthor(),
                        ...this._projectComment(false)
                    ]
                }
            },
            { $unwind: '$parent' }
        ])
        : Post.aggregate([
            ...this._base(mongoose.Types.ObjectId(_postId)),
            ...this._paginate(page, size),
            { $replaceRoot: { newRoot: '$comments' } },
            ...this._handleReactions(_userId),
            ...this._lookupAuthor(),
            ...this._lookupParent(),
            ...this._projectComment(true)
        ]);
    }

    _getPost (_postId, _userId, size) {
        return Post.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(_postId) } },
            {
                $facet: {
                    comments: [
                        { $project: { _id: 0, comments: 1 } },
                        { $unwind: { path: '$comments', includeArrayIndex: 'comments.floor' } },
                        ...this._paginate(1, size),
                        { $replaceRoot: { newRoot: '$comments' } },
                        ...this._handleReactions(_userId),
                        ...this._lookupAuthor(),
                        ...this._lookupParent(),
                        ...this._projectComment(true)
                    ],
                    post: [
                        { $project: { rating: 0, comments: 0, __v: 0 } },
                        { $addFields: { floor: 1, liked: { $in: [ _userId, '$likes' ] }, disliked: { $in: [ _userId, '$dislikes' ] } } },
                        ...this._lookupAuthor()
                    ]
                }
            },
            { $unwind: '$post' },
            { $project: 
                {
                    post: {
                        comments: '$comments', author: { _id: 1, username: 1, type: 1, school: 1 }, floor: 1, liked: 1, disliked: 1,
                        _id: 1, title: 1, content: 1, tags: 1, nLikes: 1, nDislikes: 1, nComments: 1, createdAt: 1, updatedAt: 1
                    }
                }
            },
            { $replaceRoot: { newRoot: '$post' } }
        ]);
    }

    _base (_postId) {
        return [
            { $match: { _id: mongoose.Types.ObjectId(_postId) } },
            { $project: { _id: 0, comments: 1 } },
            { $unwind: { path: '$comments', includeArrayIndex: 'comments.floor' } }
        ];
    }

    _paginate (page, size) {
        return [
            { $skip: (page - 1) * size },
            { $limit: size }
        ];
    }

    _handleReactions (_userId) {
        const operation = {
          nLikes: { $size: '$likes' },
          nDislikes: { $size: '$dislikes' },
        };
        if (_userId) {
          operation.liked = { $in: [ _userId, '$likes' ] };
          operation.disliked = { $in: [ _userId, '$dislikes' ] }
        }
        return [ { $set: operation } ];
    }

    _lookupAuthor () {
        return [
            { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
            { $unwind: '$author' },
            { $set: { author: { $ifNull: [ '$author', 'account removed' ] } } }
        ];
    }

    _lookupParent () {
        return [
            { $lookup: { from: 'posts', localField: 'parent', foreignField: 'comments._id', as: 'post' } },
            { $unwind: { path: '$post', preserveNullAndEmptyArrays: true } },
            { $addFields: { _parentId: '$parent', parent: '$post.comments' } },
            ...this._projectComment(true, true),
            { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } },
            { $match: { $expr: { $eq: [ '$parent._id', '$_parentId' ] } } },
            { $unset: '_parentId' }
        ];
    }

    _projectComment (showParent, keepFloor) {
        const base = {
            $project: { author: { _id: 1, username: 1, type: 1 }, floor: { $add: [ '$floor', keepFloor ? 0 : 2 ] },
            content: 1, nLikes: 1, nDislikes: 1, liked: 1, disliked: 1, nComments: 1, updatedAt: 1, createdAt: 1 }
        };
        if (showParent) {
            base.$project.parent = { _id: 1, content: 1 };
            base.$project._parentId = 1;
        }
        return [base];
    }

    _deleteInPlace (arr, condition, shouldBreak = true) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].equals(condition)) {
                arr.splice(i, 1);
                if (shouldBreak) break;
            }
        }
    }
}

module.exports = new PostService();