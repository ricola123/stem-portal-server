const controller = require('../controllers/check');

module.exports = router => {
  router.route('/check/email/:email').get(controller.emailExists);
  router.route('/check/username/:username').get(controller.userExists);
  router.route('/check/course/:name').get(controller.courseExists);
};