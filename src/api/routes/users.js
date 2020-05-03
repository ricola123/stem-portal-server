const validate = require('../middleware/validate');
const authorize = require('../middleware/authorize');

const { ResponseError } = require('../../utils');

const UserService = require('../../services/user');
const AuthService = require('../../services/auth');
const schemas = require('../../validators/users');

module.exports = router => {
  router.route('/user').get(authorize(), async (req, res) => {
    const { id } = req.user;
    const user = await UserService.getUser(id);
    res.status(200).send({ status: 200, user });
  });
  router.route('/users').post(validate(schemas.register), async (req, res) => {
    const { username, password, email, resend } = req.body;
    if (resend) {
      await AuthService.resendRegisterToken(username, email);
      res.status(204).send();
    } else {
      const user = await UserService.createUser(username, password, email);
      await AuthService.sendRegisterToken(user._id, username, email);
      res.status(201).send({ status: 201, user });
    }
  });
  router.route('/users/:key').head(validate(schemas.checker), async (req, res) => {
    const { key } = req.params;
    const exists = await UserService.checkIfExists(key);
    res.status(exists ? 204 : 404).send();
  });
  router.route('/users/:userId/update-password').post(authorize(), validate(schemas.updatePassword), async (req, res) => {
    const { id } = req.user;
    const { password, newPassword } = req.body;
    await UserService.updatePassword(id, password, newPassword);
    res.status(204).send();
  });
  router.route('/users/update/:username').post(validate(schemas.updateUser), async (req, res) => {
    const { username } = req.params;
    const { email, firstName, lastName, school, interests } = req.body;
    await UserService.updateUser(username, email, firstName, lastName, school, interests);
    res.status(204).send();
  })
  router.route('/users/update-with-password/:username').post(validate(schemas.updateUserWithPassword), async (req, res) => {
    const { username } = req.params;
    const { password, email, firstName, lastName, school, interests } = req.body;
    await UserService.updateUserWithPassword(username, password, email, firstName, lastName, school, interests);
    res.status(204).send();
  })
};