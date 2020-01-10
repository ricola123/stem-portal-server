const controller = require('../controllers/check');

module.exports = router => {
  router.route('/check-email/:email').get(controller.emailExists);
  router.route('/check-username/:username').get(controller.userExists);
};