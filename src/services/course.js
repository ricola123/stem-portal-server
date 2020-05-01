const Course = require('../models/courses');
const User = require('../models/users');

const TagService = require('../services/tag');
const { ResponseError } = require('../utils');

class CourseService {

  async checkIfExists (name) {
    return await Course.findOne({ name });
  }
  
  async getCourses (paginator, _authorId) {
    const { query, sort, page, size } = paginator;

    if (_authorId) query.author = _authorId
    query.published = !_authorId;

    const [courses, count] = await Promise.all([
      Course.find(query)
        .sort(sort)
        .skip((size * page) - size)
        .limit(size)
        .populate('author', 'username')
        .select('name author tags rating nRatings')
        .lean(),
      Course.countDocuments(query)
    ]);
    courses.forEach(c => c.author = c.author || 'account removed');
    return { courses, page, pages: Math.ceil(count / size) || 1 };
  }

  async getInProgressCourses ({ query, page, size }, user) {
    const [{ pages, courses }] = await User.aggregate([
      { $match: { _id: user.id } },
      { $project: { _id: 0, courses: '$courses.inProgress' } },
      {
        $facet: {
          pages: [
            {
              $project: {
                pages: {
                  $ceil: { $divide: [ { $size: '$courses' }, size ] }
                } 
              }
            }
          ],
          courses: [
            { $lookup: { from: 'courses', localField: 'courses', 'foreignField': '_id', as: 'courses' } },
            { $unwind: '$courses' },
            { $replaceRoot: { newRoot: '$courses' } },
            { $match: query },
            { $skip: (page - 1) * size },
            { $limit: size },
            { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
            { $unwind: '$author' },
            { $project: { name: 1, author: { username: 1 }, tags: 1, rating: 1, nRatings: 1 } }
          ]
        }
      },
      { $project: { courses: 1, pages: { $arrayElemAt: [ '$pages.pages', 0 ] } } }
    ]);
    return { courses, pages, page };
  }

  async getTeachingCourses ({ query, page, size }, user) {

  }

  async getFinishedCourses ({ query, page, size }, user) {
    const [{ pages, courses }] = await User.aggregate([
      { $match: { _id: user.id } },
      { $project: { _id: 0, courses: '$courses.finished' } },
      {
        $facet: {
          pages: [
            {
              $project: {
                pages: {
                  $ceil: { $divide: [ { $size: '$courses' }, size ] }
                } 
              }
            }
          ],
          courses: [
            { $lookup: { from: 'courses', localField: 'courses', 'foreignField': '_id', as: 'courses' } },
            { $unwind: '$courses' },
            { $replaceRoot: { newRoot: '$courses' } },
            { $match: query },
            { $skip: (page - 1) * size },
            { $limit: size },
            { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
            { $unwind: '$author' },
            { $project: { name: 1, author: { username: 1 }, tags: 1, rating: 1, nRatings: 1 } }
          ]
        }
      },
      { $project: { courses: 1, pages: { $arrayElemAt: [ '$pages.pages', 0 ] } } }
    ]);
    return { courses, pages, page };
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

    if (!course.author) course.author = 'account removed';
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

  async unpublishCourse (_id, unpublisher) {
    const course = await Course.findById(_id);
    if (!course) throw new ResponseError(404, 'course not found');
    if (!unpublisher.id.equals(course.author)) throw new ResponseError(403, 'forbidden');

    course.published = false;
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

      const prevRatingInUser = rater.courses.ratings.find(rating => rating._courseId.equals(_courseId));
      if (prevRatingInUser) {
        prevRatingInUser.score = score;
        prevRatingInUser.comment = comment;
      }
    } else {
      if (prevRating) throw new ResponseError(400, 'rating already exists, send a put request instead');
      course.score += score;
      course.nRatings += 1;
      course.ratings.push({ _userId: _raterId, score, comment });
      rater.courses.ratings.push({ _courseId, score, comment });
    }

    const ratingAvg = course.score / (course.nRatings || 1) || 3.5;
    course.rating = Math.round(ratingAvg * 10) / 10;
    await Promise.all([ course.save(), rater.save() ]);
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
        const [deleted] = course.ratings.splice(i, 1);
        course.score -= deleted.score;
        course.nRatings -= 1;

        const ratingAvg = course.score / (course.nRatings || 1) || 3.5;
        course.rating = Math.round(ratingAvg * 10) / 10;

        const ratingsInUser = deleter.courses.ratings
        for (let j = 0; j < ratingsInUser.length; j++) {
          if (ratingsInUser[j]._courseId.equals(_courseId)) {
            ratingsInUser.splice(j, 1);
            break;
          }
        }

        await Promise.all([ course.save(), deleter.save() ]);

        return;
      }
    }
    throw new ResponseError(404, 'no rating to delete');
  }
}

module.exports = new CourseService();