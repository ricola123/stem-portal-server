const users = require('./users');
const auth = require('./auth');
const check = require('./check');
const courses = require('./courses');
const tags = require('./tags');
const posts = require('./posts');

module.exports = router => {
  users(router);
  auth(router);
  check(router);
  courses(router);
  tags(router);
  posts(router);

  return router;
};