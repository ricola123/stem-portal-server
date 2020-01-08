const User = require('../models/users');
const Token = require('../models/tokens');

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const utils = require('../utils')

module.exports = {
  add: (req, res) => {
    const { username, password, email } = req.body;
    User.findOne({ username }, user => {
      if (user) return res.status(400).send({ error: 'An existing user has the same username' });
      user = new User({ username, password, email, type: 'inactive' }); //inactive = not yet verified
      user.save((err, user) => {
        if (!err) {
          const token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
          utils.sendVerifyEmail(user, token.token);
          res.status(201).send({ user });
        } else {
          res.status(500).send({ error: err });
        }
      });
    })
  },
  login: (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username }, (err, user) => {
      if (!err && user) {
        bcrypt.compare(password, user.password)
          .then(match => {
            if (match) {
              const payload = { user: user.username };
              const options = { expiresIn: '7d', issuer: 'https://www.stem-portal.edu.hk' };
              const secret = process.env.JWT_SECRET;
              const token = jwt.sign(payload, secret, options);
              res.status(201).send({ user, token });
            } else {
              res.status(401).send({ error: 'Authentication Error' });
            }
          })
          .catch(err => { res.status(500).send({ error: err }) });
      } else {
        res.status(404).send({ error: err });
      }
    });
  },
  activate: (req, res) => {
    const { username } = req.params;
    const { token, cancel } = req.body;
    console.log(username, token, cancel);

    User.findOne({ username }, (err, user) => {
      if (err) return res.status(400).send({ error: err, description: 'No such user' });
      if (user.type !== 'inactive') return res.status(400).send({ error: 'User already verified' })
      Token.findOne({ _userId: user._id, token }, (err, token) => {
        if (err) return res.status(400).send({ error: err, description: 'No such token, may be expired' });
        if (cancel) {
          token.remove();
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
  }
}