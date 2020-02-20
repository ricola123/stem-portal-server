const validate = require('../middleware/validate');
const paginate = require('../middleware/paginate');
const authorize = require('../middleware/authorize');

const PostService = require('../../services/post');

const schemas = require('../../validators/posts');

module.exports = router => {
    router.route('/forum/posts').get(validate(schemas.getPosts), paginate('post'), async (req, res) => {
        const { posts, page } = await PostService.getPosts(req.paginator);
        res.status(200).send({ status: 200, posts, page });
    });
    router.route('/forum/posts').post(authorize(), validate(schemas.createPost), async (req, res) => {
        const author = req.user;
        const { title, content, tags } = req.body;
        const post = await PostService.createPost(author, title, content, tags);
        res.status(201).send({ status: 201, post });
    });
    router.route('/forum/posts/:id').get(authorize('optional'), validate(schemas.getPost), async (req, res) => {
        const _postId = req.params.id;
        const { post, pages } = await PostService.getPost(_postId, req.user.id, req.query.size || 10);
        res.status(200).send({ status: 200, post, pages });
    });
    router.route('/forum/posts/:id').patch(authorize(), validate(schemas.updatePost), async (req, res) => {
        const _postId = req.params.id;
        await PostService.updatePost(req.user.id, _postId, req.body);
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
        await PostService.reactPost(req.user.id, _postId, liked, disliked);
        res.status(204).send();
    });
    router.route('/forum/posts/:id/comments').get(validate(schemas.getComments), async (req, res) => {
        const _postId = req.params.id;
        const { reply, page, size = 10 } = req.query;
        const { comments, page: resPage, pages, parent } = await PostService.getComments(_postId, reply, page, size);
        res.status(200).send({ status: 200, parent, comments, page: resPage, pages });
    });
    router.route('/forum/posts/:id/comments').post(authorize(), validate(schemas.createComment), async (req, res) => {
        const _postId = req.params.id;
        const { content, reply } = req.body;
        const comment = await PostService.createComment(_postId, req.user.id, content, reply);
        res.status(201).send({ status: 201, comment });
    });
    router.route('/forum/posts/:pid/comments/:cid').patch(authorize(), validate(schemas.updateComment), async (req, res) => {
        const { pid, cid } = req.params;
        const updator = req.user;
        const { content } = req.body;
        await PostService.updateComment(pid, cid, updator, content);
        res.status(204).send();
    });
    router.route('/forum/posts/:pid/comments/:cid').delete(authorize(), validate(schemas.deleteComment), async (req, res) => {
        const { pid, cid } = req.params;
        const deletor = req.user;
        await PostService.deleteComment(pid, cid, deletor);
        res.status(204).send();
    });
    router.route('/forum/posts/:pid/comments/:cid/react').post(authorize(), validate(schemas.reactComment), async (req, res) => {
        const { pid, cid } = req.params;
        const { liked, disliked } = req.body;
        await PostService.reactComment(req.user.id, pid, cid, liked, disliked);
        res.status(204).send();
    });
};