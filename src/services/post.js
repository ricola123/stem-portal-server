const Post = require('../models/posts');

const TagService = require('../services/tag');
const { ResponseError } = require('../utils');

const mongoose = require('mongoose');

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

    async getPost (_postId, user) {
        const post = await Post.findById(_postId, { comments: { $slice: 10 } })
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
        const [comments, [{ count }]] = await Promise.all([
            Post.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(_postId) } },
                { $unwind: '$comments' },
                { $match: reply ? { 'comments.replyTo': mongoose.Types.ObjectId(reply) } : {} },
                { $replaceWith: '$comments' },
                { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
                { $unwind: '$author' },
                { $skip: (page - 1) * size },
                { $limit: size },
                { $project: { _id: 1, replyTo: 1, author: { _id: 1, username: 1 }, content: 1, nLikes: 1, nDislikes: 1, nReplies: 1, updatedAt: 1, createdAt: 1 } }
            ]),
            Post.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(_postId) } },
                { $unwind: '$comments' },
                { $match: reply ? { 'comments.replyTo': mongoose.Types.ObjectId(reply) } : {} },
                { $replaceWith: '$comments' },
                { $count: 'count' }
            ])
        ]);
        return { comments, pages: Math.ceil(count / size) || 1 };
    }

    async createComment (_postId, author, content, replyTo) {
      const post = await Post.findOne({ _id: _postId });
      if (!post) throw new ResponseError(404, 'post not found');

      const _commentId = mongoose.Types.ObjectId();
      post.comments.push({ _id: _commentId, author: author.id, content, replyTo });
      const { _id, nLikes, nDislikes, nReplies, createdAt } = post.comments[post.comments.length - 1];

      if(replyTo) {
        const targetComment = post.comments.id(replyTo);
        targetComment.replies.push(_commentId);
        targetComment.nReplies = targetComment.replies.length;
      }

      post.nComments = post.comments.length;
      await post.save();
      return { _id, author: author.id, content, replyTo, nLikes, nDislikes, nReplies, createdAt };
    }

    async updateComment (_postId, _commentId, author, content) {
        const post = await Post.findById(_postId)
    }

    deleteInPlace(arr, condition, shouldBreak = true) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].equals(condition)) {
                arr.splice(i, 1);
                if (shouldBreak) break;
            }
        }
    }
}

module.exports = new PostService();