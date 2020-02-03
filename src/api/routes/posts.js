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
        const author = req.user;
        const { title, content, tags } = req.body;
        const post = await PostService.createPost(author, title, content, tags);
        res.status(201).send({ status: 201, post });
    });
    router.route('/forum/posts/:id').get(authorize('optional'), async (req, res) => {
        const _postId = req.params.id;
        const post = await PostService.getPost(_postId, req.decoded);
        res.status(200).send({ status: 200, post });
    });
    router.route('/forum/posts/:id').patch(authorize(), validate(schemas.updatePost), async (req, res) => {
        const updator = req.user;
        const _postId = req.params.id;
        await PostService.updatePost(updator, _postId, req.body);
        res.status(204).send();
    });
    router.route('/forum/posts/:id').delete(authorize(), validate(schemas.deletePost), async (req, res) => {
        const deletor = req.user;
        const _postId = req.params.id;
        await PostService.deletePost(deletor, _postId);
        res.status(204).send();
    });
    router.route('/forum/posts/:id/react').post(authorize(), validate(schemas.reactPost), async (req, res) => {
        const _postId = req.params.id;
        const { liked, disliked } = req.body;
        await PostService.reactPost(req.user, _postId, liked, disliked);
        res.status(204).send();
    });
    router.route('/forum/posts/:id/comments').get(validate(schemas.getComments), async (req, res) => {
        const _postId = req.params.id;
        const comments = await PostService.getComments(_postId, req.query);
        res.status(200).send({ status: 200, postId: _postId, comments });
    });
    router.route('/forum/posts/:id/comments').post(authorize(), validate(schemas.createComment), async (req, res) => {
        const _postId = req.params.id;
        const { author, content, replying } = req.body;
        const comment = await PostService.createComment(_postId, author, content, replying);
        res.status(201).send({ status: 201, comment });
    });
};