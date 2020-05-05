const users = require('./routes/users');
const auth = require('./routes/auth');
const courses = require('./routes/courses');
const tags = require('./routes/tags');
const posts = require('./routes/posts');
const games = require('./routes/games');
const uploads = require('./routes/uploads');

module.exports = router => {
  [users, auth, courses, tags, posts, games, uploads]
    .forEach(f => f(router));

  return router;
};