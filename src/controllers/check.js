const User = require('../models/users');
const Course = require('../models/courses');

module.exports = {
  userExists: (req, res) => {
    const { username } = req.params;
    User.findOne({ username }, (err, user) => {
      if (user) return res.status(200).send();
      res.status(404).send({ error: err });
    });
  },
  emailExists: (req, res) => {
    const { email } = req.params;
    User.findOne({ email }, (err, user) => {
      if (user) return res.status(200).send();
      res.status(404).send({ error: err});
    });
  },
  courseExists: (req, res) => {
    const { name } = req.params;
    console.log(name)
    Course.findOne({ name }, (err, course) => {
      if (course) return res.status(200).send();
      res.status(404).send({ error: err });
    });
  }
}