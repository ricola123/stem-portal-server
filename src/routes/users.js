const controller = require('../controllers/users');

module.exports = router => {
  router.route('/users').post(controller.add);
  router.route('/users/:username').get(controller.exists);
  router.route('/users/change-password').post(controller.change);
};