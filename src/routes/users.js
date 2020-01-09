const controller = require('../controllers/users');
const validateToken = require('../utils').validateToken;

module.exports = router => {
  router.route('/user').get(validateToken, controller.self);
  router.route('/users').post(controller.add);
  router.route('/users/:username').get(controller.exists);
  router.route('/users/change-password').post(controller.change);
};