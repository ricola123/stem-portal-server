const Tag = require('../../models/tags');
const TagService = require('../../services/tag');

module.exports = router => {
  router.route('/tags').get(async (req, res) => {
    const tags = await TagService.getTags();
    res.status(200).send({ status: 200, tags });
  });
  router.route('/tags/courses').get(async (req, res) => {
    const tags = await TagService.getCourseTags();
    res.status(200).send({ status: 200, tags });
  });
  router.route('/tags/posts').get(async (req, res) => {
    const tags = await TagService.getPostTags();
    res.status(200).send({ status: 200, tags });
  });
};