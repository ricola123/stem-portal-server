const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true, unique: true },
  author: { type: Schema.Types.ObjectId, required: true, unique: false, ref: 'User' },
  content: { type: String, required: true, trim: true },
  likes: [{ type: Schema.Types.ObjectId, required: false, unique: false, ref: 'User' }],
  dislikes: [{ type: Schema.Types.ObjectId, required: false, unique: false }],
  parent: { type: Schema.Types.ObjectId, required: false, unique: false },
  comments: [{ type: Schema.Types.ObjectId, required: false, unique: false }],
  nComments: { type: Number, default: 0 }
}, { timestamps: true });

const postSchema = new Schema({
  author: { type: Schema.Types.ObjectId, required: true, unique: false, ref: 'User' },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  tags: [{ type: String, required: true, trim: true }],
  likes: [{ type: Schema.Types.ObjectId, required: false, unique: false, ref: 'User' }],
  nLikes: { type: Number, required: false, default: 0 },
  dislikes: [{ type: Schema.Types.ObjectId, required: false, unique: false }],
  nDislikes: { type: Number, required: false, default: 0 },
  rating: { type: Number, required: false, default: 0 },
  comments: [{ type: commentSchema, required: false, unqiue: false }],
  nComments: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);