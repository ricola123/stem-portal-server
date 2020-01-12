const Course = require('../models/courses');
const Tag = require('../models/tags');

const saveTags = tags => {
  tags.forEach(name => {
    Tag.findOne({ name }, (err, tag) => {
      if (err) return res.status(500).send();
      if (tag) return;
      tag = new Tag({ name });
      tag.save(err => { console.log(err) });
    });
  });
};

module.exports = {
  create: (req, res) => {
    const { name, description, tags, chapters, author } = req.body;
    Course.findOne({ name }, (err, course) => {
      if (err) return res.status(500).send();
      if (course) return res.status(400).send({ error: 'A course with the same name already exists' });
      saveTags(tags);
      course = new Course({ name, author, description, tags, chapters });
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
    saveTags(course.tags);
    Course.updateOne({ _id: id }, course, err => {
      if (err) return res.status(500).send();
      res.status(204).send();
    });
  },
  getTags: (req, res) => {
    Tag.find({}).sort('name').select('name -_id').then((tags, err) => {
      if (err) return res.status(500).send();
      res.status(200).send(tags.map(({ name }) => name));
    });
  }
}