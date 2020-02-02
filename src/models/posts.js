const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentSchema = new Schema({
  author: [{
    type: Schema.Types.ObjectId,
    required: true,
    unique: false,
    ref: 'User'
  }],
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
    default: 0
  },
  nDislikes: {
    type: 'Number'
  }
}, { timestamps: true });

const postSchema = new Schema({
  title: {
    type: 'String',
    required: true,
    trim: true,
  },
  author: [{
    type: Schema.Types.ObjectId,
    required: true,
    unique: false,
    ref: 'User'
  }],
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
  comments: [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);