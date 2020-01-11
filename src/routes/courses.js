const controller = require('../controllers/courses');

module.exports = router => {
  router.route('/courses').post(controller.create);
  router.route('/courses/:id').put(controller.update);
}