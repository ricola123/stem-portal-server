const validate = require('../middleware/validate');

const AuthService = require('../../services/auth');
const schemas = require('../../validators/auth');

module.exports = router => {
  router.route('/auth/verify/:username').post(validate(schemas.verify), async (req, res) => {
    const { username } = req.params;
    const { token, cancel } = req.body;
    if (cancel) {
      await AuthService.revokeToken(username, token);
      res.status(200).send({ status: 200, message: 'cancelled' });
    } else {
      await AuthService.verifyToken(username, token);
      res.status(200).send({ status: 200, message: 'verified token' });
    }
  });
  router.route('/auth/activate/:username').post(validate(schemas.activate), async (req, res) => {
    const { username } = req.params;
    const { role, firstName, lastName, gender, school, interests } = req.body;
    await AuthService.activateUser(username, role, firstName, lastName, gender, school, interests);
    res.status(204).send();
  });
  router.route('/auth/login').post(validate(schemas.login), async (req, res) => {
    const { username, password } = req.body;
    const { user, jwt } = await AuthService.loginUser(username, password);
    res.status(200).send({ status: 200, user, token: jwt });
  });
  router.route('/auth/forgot-password').post(validate(schemas.forgotPassword), async (req, res) => {
    const { username, email } = req.body;
    await AuthService.issueResetPasswordToken(username, email);
    res.status(204).send();
  });
  router.route('/auth/cancel-token/:token').post(validate(schemas.cancelToken), async (req, res) => {
    const { token } = req.params;
    const { username } = req.body;
    await AuthService.revokeToken(username, token);
    res.status(200).send({ status: 200, message: 'cancelled' });
  });
  router.route('/auth/reset-password').post(validate(schemas.resetPassword), async (req, res) => {
    const { username, password, token } = req.body;
    await AuthService.resetPassword(username, password, token);
    res.status(204).send();
  });
};