const Post = require('../models/posts');

const TagService = require('../services/tag');
const { ResponseError } = require('../utils');

class PostService {

    async getPosts (paginator) {
        const { query, sort, page, size } = paginator;
        const posts = await Post
            .find(query)
            .select('title author tags rating updatedAt')
            .sort(sort)
            .skip((size * page) - size)
            .limit(size)
            .populate('author', 'username')
            .lean();
        return posts;
    }

    async createPost (author, title, content, tags) {
        const post = new Post({ author: author.id, title, content, tags });
        await Promise.all([
            TagService.updatePostTags(post._id, tags),
            post.save()
        ]);
        return { _id: post._id, author: post.author, title, content, tags };
    }
}

module.exports = new PostService();