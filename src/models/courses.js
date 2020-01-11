const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const courseSchema = new Schema({
  name: {
    type: 'String',
    required: true,
    trim: true,
    unique: true,
  },
  author: {
    type: 'String',
    required: true,
    trim: true
  },
  description: {
    type: 'String',
    required: true,
    trim: true
  },
  tags: {
    type: 'Array',
    required: true,
    trim: true
  },
  chapters: {
    type: 'Array',
    required: true,
    trim: true
  }
});

module.exports = mongoose.model('Course', courseSchema);