const controller = require('../controllers/auth');

module.exports = router => {
  router.route('/auth/login').post(controller.login);
  router.route('/auth/reset-password').post(controller.resetPassword);
  router.route('/auth/activate/:username').post(controller.activate);
  router.route('/auth/acquire-password/:username').post(controller.acquire);
}