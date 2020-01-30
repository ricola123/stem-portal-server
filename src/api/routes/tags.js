const Tag = require('../../models/tags');
const TagService = require('../../services/tag');

module.exports = router => {
  router.route('/tags').get(async (req, res) => {
    const tags = await TagService.getTags();
    res.status(200).send({ status: 200, tags });
  });
};