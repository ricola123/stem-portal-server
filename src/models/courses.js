const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ratingSchema = new Schema({
  _userId: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: false,
    ref: 'User'
  },
  score: {
    type: 'Number',
    required: true
  },
  comment: {
    type: 'String',
    required: true
  }
}, { timestamps: true, _id: false });

const courseSchema = new Schema({
  name: {
    type: 'String',
    required: true,
    trim: true,
    unique: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: false,
    ref: 'User'
  },
  description: {
    type: 'String',
    required: true,
    trim: true
  },
  tags: [{
    type: 'String',
    required: true,
    trim: true
  }],
  chapters: {
    type: 'String',
    required: true
  },
  published: {
    type: 'Boolean',
    default: false
  },
  publishedAt: {
    type: Date,
    required: false
  },
  score: { // score is the sum of all ratings
    type: 'Number',
    required: true,
    default: 0
  },
  rating: { // rating is the avg value from all ratings: score / nRatings
    type: 'Number',
    required: true,
    default: 3.5
  },
  nRatings: { // nRatings is the number of ratings: ratings.length
    type: 'Number',
    required: true,
    default: 0
  },
  ratings: [ratingSchema]
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);