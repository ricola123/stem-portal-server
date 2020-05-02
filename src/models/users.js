const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// schema maps to a collection
const Schema = mongoose.Schema;

const myCourseSchema = new Schema({
  inProgress: [{
    type: Schema.Types.ObjectId,
    unique: false,
    ref: 'Course'
  }],
  finished: [{
    type: Schema.Types.ObjectId,
    unique: false,
    ref: 'Course'
  }],
  ratings: [{
    _courseId: {
      type: Schema.Types.ObjectId,
      unique: false,
      ref: 'Course'
    },
    score: Number,
    comment: String
  }]
}, { _id: false });

const userSchema = new Schema({
  username: {
    type: 'String',
    required: true,
    trim: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: 'String',
    required: true,
    trim: true
  },
  email: {
    type: 'String',
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  type: {
    type: 'String',
    required: true
  },
  firstName: {
    type: 'String',
    trim: true
  },
  lastName: {
    type: 'String',
    trim: true
  },
  gender: {
    type: 'String'
  },
  school: {
    type: 'String',
    trim: true
  },
  interests: [{
    type: 'String',
    trim: true
  }],
  courses: myCourseSchema,
  meterEXP: {
    type: 'Number',
    default: 0,
    trim: true
  }
});

// encrypt password before save
userSchema.pre('save', function (next) {
  const user = this;
  if(!user.isModified || !user.isNew) { // don't rehash if it's an old user
    next();
  } else {
    const saltRounds = parseInt(process.env.SALT_ROUNDS);
    bcrypt.hash(user.password, saltRounds, function(err, hash) {
      if (err) {
        console.log('Error hashing password for user', user.username);
        next(err);
      } else {
        user.password = hash;
        next();
      }
    });
  }
});

module.exports = mongoose.model('User', userSchema);