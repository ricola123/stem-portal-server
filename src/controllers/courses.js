const Course = require('../models/courses');
const Tag = require('../models/tags');
const mongoose = require('mongoose');
const User = require('../models/users');

const saveTags = (tags, course_id) => {
  // save or update new tags
  Tag.find({ courses: course_id }).distinct('name', (err, currentTags) => {
    if (err) return;
    const newTags = tags.filter(tag => !currentTags.includes(tag));
    newTags.forEach(tag => {
      Tag.updateOne({ name: tag }, { $push: { courses: course_id } }, { upsert: true }, err => { console.log(err || '') });
    });
    // update (or delete) removed tags
    const removedTags = currentTags.filter(tag => !tags.includes(tag));
    Tag.updateMany({ name: { $in: removedTags } }, { $pull: { courses: course_id } }, err => {
      console.log(err || '');
      Tag.deleteMany({ courses: { $size: 0 } }, err => { console.log(err || '') });
    });
  });
};

module.exports = {
  getAll: (req, res, next) => {
    if (req.query.student) {
      const studentName = req.query.student;
      User.findOne({ username: studentName }, (err, user) => {
        if (err) return res.status(500).send();
        const courses = user.onGoingCourses;
        Course.find({ _id: { $in: courses }, published: true }, (err, ongoing) => {
          if (err) return res.status(500).send({ error: err });
          ongoing = ongoing.map(({ _id, name, author, tags, ratings }) => {
            const votes = ratings.length;
            const rating = ratings.reduce((total, { score }) => (total + score), 0) / votes || 'No ratings yet';
            return { id: _id, title: name, author, tags, votes, rating };
          });
          Course.find({ _id: { $nin: courses }, published: true }, (err, others) => {
            if (err) return res.status(500).send({ error: err });
            others = others.map(({ _id, name, author, tags, ratings }) => {
              const votes = ratings.length;
              const rating = ratings.reduce((total, { score }) => (total + score), 0) / votes || 'No ratings yet';
              return { id: _id, title: name, author, tags, votes, rating };
            });
            res.status(200).send({ ongoing, others });
          })
        })
      });
    } else {
      const author = req.query.teacher;
      const options = author ? { author } : { published: true };
      Course.find(options).exec((err, courses) => {
        if (err) return res.status(500).send();
        const data = courses.map(({ _id, name, author, tags, ratings }) => {
          const votes = ratings.length;
          const rating = ratings.reduce((total, { score }) => (total + score), 0) / votes || 'No ratings yet';
          return { id: _id, title: name, author, tags, votes, rating };
        });
        res.status(200).send(data);
      });
    }
  },
  create: (req, res, next) => {
    const { username } = req.decoded;
    User.findOne({ username }, (err, user) => {
      if (err) return res.status(500).send();
      if (user.type !== 'teacher') return res.status(401).send();

      const { name, description, tags, chapters, author } = req.body;
      Course.findOne({ name }, (err, course) => {
        if (err) return res.status(500).send();
        if (course) return res.status(400).send({ error: 'A course with the same name already exists' });
        course = new Course({ name, author, description, tags, chapters: JSON.stringify(chapters) });
        saveTags(tags, course._id);
        course.save((err, course) => {
          if (err) return res.status(500).send();
          const { _id: id, name: title, description, tags, chapters, author } = course;
          res.status(201).send({ id, title, description, tags, chapters: JSON.parse(chapters), author });
        });
      });
    });
  },
  read: (req, res, next) => {
    const _id = mongoose.Types.ObjectId(req.params.id);
    Course.findOne({ _id }, (err, course) => {
      if (err || !course) return res.status(500).send();
      const { _id: id, name: title, description, tags, chapters, author, ratings } = course;
      res.status(200).send({ id, title, description, tags, ratings, chapters: JSON.parse(chapters), author });
    });
  },
  update: (req, res, next) => {
    const { username } = req.decoded;
    const { id } = req.params;
    const { course } = req.body;
    User.findOne({ username }, (err, user) => {
      if (err || !user) return res.status(500).send();
      if (user.type !== 'teacher') return res.status(401).send();
      if (username !== course.author) return res.status(401).send();
      course.chapters = JSON.stringify(course.chapters);
      delete course._id;
      Course.updateOne({ _id: mongoose.Types.ObjectId(id) }, course, err => {
        if (err) return res.status(500).send();
        saveTags(course.tags, id);
        res.status(204).send();
      });
    });
  },
  delete: (req, res, next) => {
    const { username } = req.decoded;
    const { _id } = mongoose.Types.ObjectId(req.params.id);
    User.findOne({ username }, (err, user) => {
      if (err || !user) return res.status(500).send();
      if (user.type !== 'teacher') return res.status(401).send();
      Course.findOne({ _id }, (err, course) => {
        if (err || !course) return res.status(500).send();
        if (username !== course.author) return res.status(401).send();
        // update or remove tags
        Tag.updateMany({ courses: _id }, { $pull: { courses: _id } }, err => {
          console.log(err || '');
          Tag.deleteMany({ courses: { $size: 0 } }, err => { console.log(err || '') });
        });
        // delete course
        Course.deleteOne({ _id }, err => {
          if (err) return res.status(500).send();
          res.status(204).send();
        });
      });
    });
  }
}