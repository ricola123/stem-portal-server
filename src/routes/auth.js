const controller = require('../controllers/auth');
const validateInput = require('../middleware/validations').validateInput;

const loginSchema = require('../validations/login');

module.exports = router => {
  router.route('/auth/login').post(validateInput(loginSchema), controller.login);
  router.route('/auth/reset-password').post(controller.resetPassword);
  router.route('/auth/activate/:username').post(controller.activate);
  router.route('/auth/acquire-password/:username').post(controller.acquire);
}