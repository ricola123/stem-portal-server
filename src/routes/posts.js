const controller = require('../controllers/posts');
const validateRole = require('../middleware/validations').validateRole;

module.exports = router => {
  router.route('/forum/posts').get(controller.getAll);
  router.route('/forum/posts').post(validateRole, controller.create);
};