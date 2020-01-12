const controller = require('../controllers/courses');
const validateToken = require('../utils').validateToken;

module.exports = router => {
  router.route('/courses').get(controller.getAll);
  router.route('/courses').post(validateToken, controller.create);
  router.route('/courses/:id').get(validateToken, controller.read);
  router.route('/courses/:id').put(validateToken, controller.update);
  router.route('/courses/:id').delete(validateToken, controller.delete);
}