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
    const { courses, page, pages } = await CourseService.getCourses(paginator);
    res.status(200).send({ status: 200, courses, page, pages });
  });
  router.route('/courses/in-progress').get(authorize(), validate(schemas.getInProgressCourses), paginate('course'), async (req, res) => {
    const { courses, pages, page } = await CourseService.getInProgressCourses(req.paginator, req.user);
    res.status(200).send({ status: 200, courses, pages, page });
  });
  router.route('/courses/teaching').get(authorize('teacher'), validate(schemas.getTeachingCourses), paginate('course'), async (req, res) => {
    const { courses, pages, page } = await CourseService.getCourses(req.paginator, req.user.id);
    res.status(200).send({ status: 200, courses, pages, page });
  });
  router.route('/courses/finished').get(authorize(), validate(schemas.getFinishedCourses), paginate('course'), async (req, res) => {
    const { courses, pages, page } = await CourseService.getFinishedCourses(req.paginator, req.user);
    res.status(200).send({ status: 200, courses, pages, page });
  });
  router.route('/courses').post(authorize('teacher'), validate(schemas.createCourse), async (req, res) => {
    const { name, description, tags, chapters } = req.body;
    const author = req.user;
    const course = await CourseService.createCourse(name, author, description, tags, JSON.stringify(chapters));
    res.status(201).send({ status: 201, course });
  });
  router.route('/courses/:id').get(authorize('optional'), validate(schemas.getCourse), async (req, res) => {
    const { id } = req.params;
    const course = await CourseService.getCourse(id, req.user);
    res.status(200).send({ status: 200, ...course });
  });
  router.route('/courses/:id').put(authorize('teacher'), validate(schemas.updateCourse), async (req, res) => {
    const { id } = req.params;
    const { name, description, tags, chapters } = req.body;
    const updator = req.user;
    await CourseService.updateCourse(id, name, updator, description, tags, JSON.stringify(chapters));
    res.status(204).send();
  });
  router.route('/courses/:id/progress').put(authorize(), validate(schemas.updateCourseProgress), async (req, res) => {
    const { id } = req.params;
    await CourseService.updateCourseProgress(id, req.user, req.body.progress);
    res.status(204).send();
  });
  router.route('/courses/:id/publish').post(authorize('teacher'), validate(schemas.publishCourse), async (req, res) => {
    const { id } = req.params;
    const publisher = req.user;
    await CourseService.publishCourse(id, publisher);
    res.status(204).send();
  });
  router.route('/courses/:id/unpublish').post(authorize('teacher'), validate(schemas.unpublishCourse), async (req, res) => {
    const { id } = req.params;
    const unpublisher = req.user;
    await CourseService.unpublishCourse(id, unpublisher);
    res.status(204).send();
  });
  router.route('/courses/:id').delete(authorize('teacher'), validate(schemas.deleteCourse), async (req, res) => {
    const { id } = req.params;
    const deleter = req.user;
    await CourseService.deleteCourse(id, deleter);
    res.status(204).send();
  });
  router.route('/courses/:id/ratings').post(authorize(), validate(schemas.rateCourse), async (req, res) => {
    const { id } = req.params;
    const { score, comment } = req.body;
    const rater = req.user;
    await CourseService.rateCourse(id, rater.id, { score, comment });
    res.status(204).send();
  });
  router.route('/courses/:id/ratings').put(authorize(), validate(schemas.rateCourse), async (req, res) => {
    const { id } = req.params;
    const { score, comment } = req.body;
    const rater = req.user;
    await CourseService.rateCourse(id, rater.id, { score, comment }, true);
    res.status(204).send();
  });
  router.route('/courses/:id/ratings').delete(authorize(), async (req, res) => {
    const { id } = req.params;
    const deleter = req.user;
    await CourseService.deleteRating(id, deleter.id);
    res.status(204).send();
  });
};