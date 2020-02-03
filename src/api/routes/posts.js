const validate = require('../middleware/validate');
const paginate = require('../middleware/paginate');
const authorize = require('../middleware/authorize');

const PostService = require('../../services/post');

const schemas = require('../../validators/posts');

module.exports = router => {
    router.route('/forum/posts').get(validate(schemas.getPosts), paginate('post'), async (req, res) => {
        const paginator = req.paginator;
        const posts = await PostService.getPosts(paginator);
        res.status(200).send({ status: 200, posts });
    });
    router.route('/forum/posts').post(authorize(), validate(schemas.createPost), async (req, res) => {
        const author = req.decoded;
        const { title, content, tags } = req.body;
        const post = await PostService.createPost(author, title, content, tags);
        res.status(201).send({ status: 201, post });
    });
};