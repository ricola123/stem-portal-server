const users = require('./routes/users');
const auth = require('./routes/auth');
const courses = require('./routes/courses');
const tags = require('./routes/tags');

module.exports = router => {
  [users, auth, courses, tags]
    .forEach(f => f(router));

  return router;
};