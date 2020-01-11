const Course = require('../models/courses');

module.exports = {
  create: (req, res) => {
    const { name, description, tags, chapters, author } = req.body;
    Course.findOne({ name }, (err, course) => {
      if (err) return res.status(500).send();
      if (course) return res.status(400).send({ error: 'A course with the same name already exists' });
      course = new Course({ name, author, description, tags, chapters });
      course.save((err, course) => {
        console.log(course);
        if (err) return res.status(500).send();
        const { _id: id, name: title, description, tags, chapters, author } = course;
        res.status(201).send({ id, title, description, tags, chapters, author });
      });
    });
  },
  update: (req, res) => {
    const { id } = req.params;
    const { course } = req.body;
    Course.findOne({ _id: id }, (err, course) => {
      if (err) return res.status(500).send();
      if (!course) return res.status(404).send();
      course = course;
      course.save(err => {
        if (err) return res.status(500).send();
        res.status(204).send();
      });
    });
  }
}