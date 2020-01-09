const users = require('./users');
const auth = require('./auth');

module.exports = router => {
  // router.route('/test').post((req, res) => { }) //testing
  users(router);
  auth(router);
  return router;
};