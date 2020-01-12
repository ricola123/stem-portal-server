const Course = require('../models/courses');
const Tag = require('../models/tags');
const mongoose = require('mongoose');

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
  create: (req, res) => {
    const { name, description, tags, chapters, author } = req.body;
    Course.findOne({ name }, (err, course) => {
      if (err) return res.status(500).send();
      if (course) return res.status(400).send({ error: 'A course with the same name already exists' });
      course = new Course({ name, author, description, tags, chapters });
      saveTags(tags, course._id);
      course.save((err, course) => {
        if (err) return res.status(500).send();
        const { _id: id, name: title, description, tags, chapters, author } = course;
        res.status(201).send({ id, title, description, tags, chapters, author });
      });
    });
  },
  update: (req, res) => {
    const { id } = req.params;
    const { course } = req.body;
    delete course._id;
    Course.updateOne({ _id: mongoose.Types.ObjectId(id) }, course, err => {
      if (err) return res.status(500).send();
      saveTags(course.tags, id);
      res.status(204).send();
    });
  },
  getTags: (req, res) => {
    Tag.find().sort('name').distinct('name', (err, tags) => {
      if (err) return res.status(500).send();
      res.status(200).send(tags);
    });
  }
}