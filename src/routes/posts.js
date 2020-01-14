const controller = require('../controllers/posts');
const validateToken = require('../utils').validateToken;

module.exports = router => {
  router.route('/forum/posts').get(controller.getAll);
  router.route('/forum/posts').post(validateToken, controller.create);
};