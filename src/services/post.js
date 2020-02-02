const Post = require('../../models/posts');

class PostService {

    async getPosts (paginator) {
        const { query, sort, page, size } = paginator;

        const [posts, count] = await Promise.all([
            Post.find(query)
                .sort(sort)
                .skip((size * page) - size)
                .limit(size)
        ]);
    }
}

module.exports = new PostService();