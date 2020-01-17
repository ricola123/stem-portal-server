const controller = require('../controllers/users');
const validateRole = require('../middleware/validations').validateRole;

module.exports = router => {
  router.route('/user').get(validateRole, controller.self);
  router.route('/users').post(controller.create);
  router.route('/users/register').post(controller.postRegistration);
  router.route('/users/change-password').post(controller.change);
};