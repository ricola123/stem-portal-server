const User = require('../models/users');

module.exports = {
    userExists: (req, res) => {
    const { username } = req.params;
    User.findOne({ username }, (err, user) => {
      if (user) return res.status(200).send();
      return res.status(404).send({ error: err });
    });
  },
  emailExists: (req, res) => {
    const { email } = req.params;
    User.findOne({ email }, (err, user) => {
      if (user) return res.status(200).send();
      return res.status(404).send({ error: err});
    });
  }
}