const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tagSchema = new Schema({
  name: {
    type: 'String',
    required: true,
    trim: true,
    unique: true
  },
  courses: [{
    type: Schema.Types.ObjectId,
    required: false,
    ref: 'Course',
    unique: false
  }],
  posts: [{
    type: Schema.Types.ObjectId,
    required: false,
    ref: 'Post',
    unique: false
  }]
});

module.exports = mongoose.model('Tag', tagSchema);