const users = require('./users');

module.exports = router => {
  // router.route('/test').post((req, res) => { }) //testing
  users(router);
  return router;
};