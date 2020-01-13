const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: {
    type: 'String',
    required: true,
    trim: true,
  },
  author: {
    type: 'String',
    required: true,
    trim: true
  },
  content: {
    type: 'String',
    required: true,
    trim: true
  },
  tags: [{
    type: 'String',
    trim: true
  }],
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  }
});

module.exports = mongoose.model('Post', postSchema);