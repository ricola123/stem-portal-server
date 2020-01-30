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
  cid:{
    type: Number,
    required: true
  },
  likes:{
    type: Number,
    required: false
  },
  dislikes:{
    type: Number,
    required: false
  },
  Allcomments:{
    type: Array,
    required: false
  },
  liked: {
    type: 'Boolean',
    required: false,
    default: false
  },
  disliked: {
    type: 'Boolean',
    required: false,
    default: false
  },
  notyetfollowed: {
    type: 'Boolean',
    required: false,
    default: true
  },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);