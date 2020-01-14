const User = require('../models/users');
const Token = require('../models/tokens');

const bcrypt = require('bcrypt');
const crypto = require('crypto');

const utils = require('../utils');

module.exports = {
  create: (req, res) => {
    const { username, password, email, isResend } = req.body;
    User.findOne({ username }).then((user, err) => {
      if (isResend) {
        if (!user || err) return res.status(400).send({ error: err });
        bcrypt.compare(password, user.password).then(match => {
          if (!match || user.email !== email || user.type !== 'inactive') {
            return res.status(400).send({ error: 'Credentials not entitled for another token' });
          }
          // re-sent user matches with db user, proceed to regenerate verification token
          Token.deleteOne({ _userId: user._id }, err => console.log(err || ''));
          const token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
          utils.sendVerifyEmail(user, token.token);
          res.status(201).send({ user });
        })
        .catch(err => res.status(500).send({ error: err }));
      } else {
        if (user || err) return res.status(400).send({ error: err || 'An existing user has the same username' });
        // create a new inactive user
        user = new User({ username, password, email, type: 'inactive' });
        user.save((err, user) => {
          if (!err) {
            const token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
            utils.sendVerifyEmail(user, token.token);
            res.status(201).send({ user });
          } else {
            res.status(500).send({ error: err });
          }
        });
      }
    });
  },
  self: (req, res) => {
    const { username } = req.decoded;
    User.findOne({ username }, (err, user) => {
      if (err || !user) return res.status(404).send({ type: 'visitor' });
      const { username, email, type } = user;
      res.status(200).send({ username, email, type });
    });
  },
  change: (req, res) => {
    const { username, password } = req.body;
    const saltRounds = parseInt(process.env.SALT_ROUNDS);
    bcrypt.hash(password, saltRounds, function(err, hash) {
      if (err) console.log('Error hashing password for user');
      User.updateOne({ username }, { password: hash }).then((user, err) => {
        if (user && !err) {
          return res.status(200).send({ user });
        } else {
          return res.status(404).send({ error: err });
        }
      });
    });
  },
  postRegistration: (req, res) => {
    const { username, role, firstName, lastName, gender, school, interests } = req.body;

    User.findOne({ username }, (err, user) => {
      console.log(err)
      console.log(username)
      if (err || !user) return res.status(400).send({ error: err });
      else {
        User.updateOne({ username }, { type: role, firstName, lastName, gender, school, interests }).then((user, err) => {
          if (user && !err) {
            return res.status(200).send({ user });
          } else {
            return res.status(404).send({ error: err });
          }
        });
      }
    });
  }
}