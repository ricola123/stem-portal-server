const User = require('../models/users');
const Token = require('../models/tokens');

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const utils = require('../utils');

const RequestError = require('../middleware/errors').RequestError;

module.exports = {
  login: async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) throw new RequestError(401, 'Incorrect username or password');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new RequestError(401, 'Incorrect username or password');

    const token = utils.generateToken(user.username, user.type);
    res.status(200).send({ status: 200, user, token });
  },
  activate: (req, res, next) => {
    const { username } = req.params;
    const { token, cancel } = req.body;

    User.findOne({ username }, (err, user) => {
      if (err || !user) return res.status(400).send({ error: err, description: 'No such user' });
      if (user.type !== 'inactive') return res.status(400).send({ error: 'User already verified' });
      Token.findOne({ _userId: user._id, token }, err => {
        if (err) return res.status(400).send({ error: err, description: 'No such token, may be expired' });
        if (cancel) {
          Token.deleteOne({ _userId: user._id }, err => console.log(err || ''));
          res.status(200).send({ status: 'cancelled', user: {} });
        } else {
          user.type = 'activated';
          user.save((err, user) => {
            if (err) res.status(500).send({ error: err });
            res.status(200).send({ status: 'user verified', user });
          });
        }
      })
    });
  },
  resetPassword: (req, res, next) => {
    const { username, email } = req.body;

    User.findOne({ username, email }, (err, user) => {
      if (err || !user) return res.status(400).send({ error: err });
      else {
        Token.deleteOne({ _userId: user._id }, err => console.log(err || ''));
        const token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
        utils.sendResetPasswordEmail(user, token.token);
        res.status(200).send();
      }
    });
  },
  acquire: (req, res, next) => {
    const { username } = req.params;
    const { token, cancel } = req.body;

    User.findOne({ username }, (err, user) => {
      if (err || !user) return res.status(400).send({ error: err });
      Token.findOne({ _userId: user._id, token }, err => {
        if (err) return res.status(400).send({ error: err });
        if (cancel) {
          Token.deleteOne({ _userId: user._id }, err => console.log(err || ''));
          res.status(200).send({ status: 'cancelled', user: {} });
        } else {
          res.status(200).send({ status: 'user existed', user });
        }
      });
    });
  }
}