const User = require('../models/users');
const Token = require('../models/tokens');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
  login: (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username }, (err, user) => {
      if (!err && user) {
        bcrypt.compare(password, user.password)
          .then(match => {
            if (match) {
              const payload = { username: user.username };
              const options = { expiresIn: '7d', issuer: 'https://www.stem-portal.hk' };
              const secret = process.env.JWT_SECRET;
              const token = jwt.sign(payload, secret, options);
              res.status(201).send({ user, token });
            } else {
              res.status(401).send({ error: 'Authentication Error' });
            }
          })
          .catch(err => res.status(500).send({ error: err }));
      } else {
        res.status(404).send({ error: err });
      }
    });
  },
  activate: (req, res) => {
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
  resetPassword: (req, res) => {
    const { username, email } = req.body;

  }
}