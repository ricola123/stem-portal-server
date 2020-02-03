const Post = require('../models/posts');

const TagService = require('../services/tag');
const { ResponseError } = require('../utils');

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
        return posts;
    }

    async getPost (_postId, user) {
        const post = await Post.findById(_postId, { comments: { $slice: 5 } })
            .populate('author', 'username type email school')
            .select('-rating -nComments -__v')
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

    async getComments (_postId, { replying, page = 1, size = 5 }) {
        const { comments } = await Post
            .findOne(
                { _id: _postId, 'comments.replying': replying },
                { _id: 0, comments: { $slice: [ page * size - size, size ] } }
            )
            .select('comments._id comments.author comments.content comments.nLikes comments.nDislikes comments.nReplies comments.createdAt')
            .populate('comments.author', 'username email type school')
            .lean();
        return comments;
    }

    async createComment (_postId, author, content, replying) {
        // timestamps
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