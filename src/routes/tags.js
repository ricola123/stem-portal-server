const controller = require('../controllers/tags');

module.exports = router => {
  router.route('/tags').get(controller.read);
}