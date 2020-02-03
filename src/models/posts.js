const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: false,
    ref: 'User'
  },
  content: {
    type: 'String',
    required: true,
    trim: true
  },
  likes: [{
    type: Schema.Types.ObjectId,
    unique: false,
    required: false,
    ref: 'User'
  }],
  dislikes: [{
    type: Schema.Types.ObjectId,
    unique: false,
    required: false,
    ref: 'User'
  }],
  nLikes: {
    type: 'Number',
    required: false,
    default: 0
  },
  nDislikes: {
    type: 'Number',
    required: false,
    default: 0
  },
  replies: [this]
}, { timestamps: true });

const postSchema = new Schema({
  title: {
    type: 'String',
    required: true,
    trim: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: false,
    ref: 'User'
  },
  content: {
    type: 'String',
    required: true,
    trim: true
  },
  tags: [{
    type: 'String',
    required: true,
    trim: true
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    unique: false,
    required: false,
    ref: 'User'
  }],
  dislikes: [{
    type: Schema.Types.ObjectId,
    unique: false,
    required: false,
    ref: 'User'
  }],
  comments: [commentSchema],
  rating: {
    type: 'Number',
    required: false,
    default: 0
  },
  nLikes: {
    type: 'Number',
    required: false,
    default: 0
  },
  nDislikes: {
    type: 'Number',
    required: false,
    default: 0
  },
  nComments: {
    type: 'Number',
    required: false,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);