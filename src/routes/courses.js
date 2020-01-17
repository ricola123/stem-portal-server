const controller = require('../controllers/courses');
const validateRole = require('../middleware/validations').validateRole;

module.exports = router => {
  router.route('/courses').get(controller.getAll);
  router.route('/courses').post(validateRole, controller.create);
  router.route('/courses/:id').get(validateRole, controller.read);
  router.route('/courses/:id').put(validateRole, controller.update);
  router.route('/courses/:id').delete(validateRole, controller.delete);
}