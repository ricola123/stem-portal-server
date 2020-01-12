const users = require('./users');
const auth = require('./auth');
const check = require('./check');
const courses = require('./courses');
const tags = require('./tags');

module.exports = router => {
  // router.route('/test').post((req, res) => { }) //testing
  users(router);
  auth(router);
  check(router);
  courses(router);
  tags(router);

  return router;
};