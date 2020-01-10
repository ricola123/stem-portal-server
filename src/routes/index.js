const users = require('./users');
const auth = require('./auth');
const check = require('./check');

module.exports = router => {
  // router.route('/test').post((req, res) => { }) //testing
  users(router);
  auth(router);
  check(router);
  return router;
};