const users = require('./routes/users');
const auth = require('./routes/auth');
const courses = require('./routes/courses');
const tags = require('./routes/tags');
const posts = require('./routes/posts');

module.exports = router => {
  [users, auth, courses, tags, posts]
    .forEach(f => f(router));

  return router;
};