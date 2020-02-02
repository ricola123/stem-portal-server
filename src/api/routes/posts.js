const validate = require('../middleware/validate');
const paginate = require('../middleware/paginate');
const authorize = require('../middleware/authorize');

const PostService = require('../../services/post');

const schemas = require('../../validators/posts');

module.exports = router => {
    router.route('/forum/posts').get(validate(schemas.getPosts), paginate, async (req, res) => {
        const paginator = req.paginator;
        const { page, pages, posts } = await PostService.getPosts(paginator);
        res.status(200).send({ status: 200, posts, page, pages });
    });
};