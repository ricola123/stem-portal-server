const validate = require('../middleware/validate');
const authorize = require('../middleware/authorize');
const paginate = require('../middleware/paginate');

const CourseService = require('../../services/course');
const schemas = require('../../validators/courses');

module.exports = router => {
  router.route('/courses/:name').head(authorize('teacher'), validate(schemas.checker), async (req, res) => {
    const { name } = req.params;
    const exists = await CourseService.checkIfExists(name);
    res.status(exists ? 204 : 404).send();
  });
  router.route('/courses').get(validate(schemas.getCourses), paginate('course'), async (req, res) => {
    const paginator = req.paginator;
    const { courses, page, pages } = await CourseService.getCourses(paginator, true);
    res.status(200).send({ status: 200, courses, page, pages });
  });
  router.route('/courses').post(authorize('teacher'), validate(schemas.createCourse), async (req, res) => {
    const { name, description, tags, chapters } = req.body;
    const author = req.decoded;
    const course = await CourseService.createCourse(name, author, description, tags, JSON.stringify(chapters));
    res.status(201).send({ status: 201, course });
  });
  router.route('/courses/:id').get(validate(schemas.getCourse), async (req, res) => {
    const { id } = req.params;
    const course = await CourseService.getCourse(id);
    res.status(200).send({ status: 200, course });
  });
  router.route('/courses/:id').put(authorize('teacher'), validate(schemas.updateCourse), async (req, res) => {
    const { id } = req.params;
    const { name, description, tags, chapters } = req.body;
    const updator = req.decoded;
    await CourseService.updateCourse(id, name, updator, description, tags, JSON.stringify(chapters));
    res.status(204).send();
  });
  router.route('/courses/:id').delete(authorize('teacher'), validate(schemas.deleteCourse), async (req, res) => {
    const { id } = req.params;
    const deleter = req.decoded;
    await CourseService.deleteCourse(id, deleter);
    res.status(204).send();
  });
  router.route('/courses/:id/ratings').post(authorize(), validate(schemas.rateCourse), async (req, res) => {
    const { id } = req.params;
    const { score, comment } = req.body;
    const rater = req.decoded;
    await CourseService.rateCourse(id, rater.id, { score, comment });
    res.status(204).send();
  });
  router.route('/courses/:id/ratings').put(authorize(), validate(schemas.rateCourse), async (req, res) => {
    const { id } = req.params;
    const { score, comment } = req.body;
    const rater = req.decoded;
    await CourseService.rateCourse(id, rater.id, { score, comment }, true);
    res.status(204).send();
  });
  router.route('/courses/:id/ratings').delete(authorize(), async (req, res) => {
    const { id } = req.params;
    const deleter = req.decoded;
    await CourseService.deleteRating(id, deleter.id);
    res.status(204).send();
  });
};