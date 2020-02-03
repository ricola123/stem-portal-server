const Course = require('../models/courses');
const User = require('../models/users');

const TagService = require('../services/tag');
const { ResponseError } = require('../utils');

class CourseService {

  async checkIfExists (name) {
    return await Course.findOne({ name });
  }
  
  async getCourses (paginator, published) {
    const { query, sort, page, size } = paginator;
    if (published) query.published = published;

    const [courses, count] = await Promise.all([
      Course.find(query)
        .sort(sort)
        .skip((size * page) - size)
        .limit(size)
        .populate('author', 'username')
        .select('name author tags rating nRatings'),
      Course.countDocuments(query)
    ]);
    return { courses, page, pages: Math.ceil(count / size) || 1 };
  }

  async createCourse (name, author, description, tags, chapters) {
    let course = await Course.findOne({ name });
    if (course) throw new ResponseError(400, 'an existing course already has a same name');
    course = new Course({ name, author: author.id, description, tags, chapters });
    await Promise.all([
      TagService.updateCourseTags(course._id, tags),
      course.save()
    ]);
    return await this.getCourse(course._id);
  }

  async getCourse (_id) {
    const course = await Course.findOne({ _id })
      .populate({ path: 'author', select: 'username email school firstName lastName' })
      .select('-score -nRatings -__v')
      .lean();
    if (!course) throw new ResponseError(404, 'course not found');

    course.chapters = JSON.parse(course.chapters);
    return course;
  }

  async updateCourse (_id, name, updator, description, tags, chapters) {
    const course = await Course.findById(_id);
    if (!course) throw new ResponseError(404, 'course not found');
    if (!updator.id.equals(course.author)) throw new ResponseError(403, 'forbidden');
    
    course.set({ name, description, tags, chapters });
    await Promise.all([
      TagService.updateCourseTags(course._id, tags),
      course.save()
    ]);
  }

  async publishCourse (_id, publisher) {
    const course = await Course.findById(_id);
    if (!course) throw new ResponseError(404, 'course not found');
    if (!publisher.id.equals(course.author)) throw new ResponseError(403, 'forbidden');

    course.published = true;
    await course.save();
  }

  async deleteCourse (_id, deletor) {
    const course = await Course.findById(_id);
    if (!course) throw new ResponseError(404, 'course not found');
    if (!deletor.id.equals(course.author)) throw new ResponseError(403, 'forbidden');

    await Promise.all([
      Course.findByIdAndDelete(_id),
      TagService.deRegisterCourseTags(_id)
    ]);
  }

  async rateCourse (_courseId, _raterId, rating, reRate = false) {
    const [course, rater] = await Promise.all([
      Course.findOne({ _id: _courseId, published: true }),
      User.findById(_raterId)
    ]);
    if (!course) throw new ResponseError(404, 'course not found');
    if (!rater) throw new ResponseError(400, 'no such user');

    const isRaterTakingCourse = rater.courses
      && (rater.courses.inProgress || rater.courses.finished)
      && (rater.courses.inProgress.includes(_courseId) || rater.courses.finished.includes(_courseId));

    const ratable = !course.author.equals(_raterId) && isRaterTakingCourse; // || true for debug only, need delete
    if (!ratable) throw new ResponseError(403, 'only participants can rate a course');

    const { score, comment } = rating;
    const prevRating = course.ratings.find(rating => rating._userId.equals(_raterId));

    if (reRate) {
      if (!prevRating) throw new ResponseError(400, 'no rating to put');
      course.score -= (prevRating.score - score);
      prevRating.score = score;
      prevRating.comment = comment;
    } else {
      if (prevRating) throw new ResponseError(400, 'rating already exists, send a put request instead');
      course.score += score;
      course.nRatings += 1;
      course.ratings.push({ _userId: _raterId, score, comment });
    }

    const ratingAvg = course.score / (course.nRatings || 1) || 3.5;
    course.rating = Math.round(ratingAvg * 10) / 10;
    await course.save();
  }

  async deleteRating (_courseId, _deleterId) {
    const [course, deleter] = await Promise.all([
      Course.findOne({ _id: _courseId, published: true }),
      User.findById(_deleterId)
    ]);
    if (!course) throw new ResponseError(404, 'course not found');
    if (!deleter) throw new ResponseError(400, 'no such user');

    for (let i = 0; i < course.ratings.length; i++) {
      if (course.ratings[i]._userId.equals(_deleterId)) {
        const deleted = course.ratings.splice(i, 1);
        course.score -= deleted.score;
        course.nRatings -= 1;

        const ratingAvg = course.score / (course.nRatings || 1) || 3.5;
        course.rating = Math.round(ratingAvg * 10) / 10;
        await course.save();

        return;
      }
    }
    throw new ResponseError(404, 'no rating to delete');
  }
}

module.exports = new CourseService();