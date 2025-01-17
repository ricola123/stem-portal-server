const User = require('../models/users');
const Course = require('../models/courses');
const Post = require('../models/posts');

const AuthService = require('./auth');

const { ResponseError } = require('../utils');

class UserService {

  async checkIfExists (key) {
    const isEmail = /^\w+([\\.-]?\w+)*@\w+([\\.-]?\w+)*(\.\w{2,3})+$/.test(key);
    const exists = await User.findOne(isEmail ? { email: key } : { username: key });
    return exists;
  }
  
  async getUser (_userId) {
    const user = await User.findById(_userId).select('-password -__v');
    if (!user) throw new ResponseError(404, 'user not found');
    return user;
  }

  async createUser (username, password, email) {
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) throw new ResponseError(400, 'an existing user has a same username or email address');

    user = new User({ username, password, email, type: 'inactive', courses: { inProgress: [], finished: [] } });
    await user.save();
    return await User.findById(user._id).select('-__v -password');
  }

  async updatePassword (userId, curPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) throw new ResponseError(400, 'user not found');

    const match = await AuthService.comparePassword(curPassword, user.password);  
    if (!match) throw new ResponseError(403, 'cannot update password: wrong current password');

    user.password = await AuthService.hashPassword(newPassword);
    await user.save();
  }

  async updateUser (username, email, firstName, lastName, school, interests) {
    const user = await User.findOne({ username });
    if (!user) throw new ResponseError(400, 'user not found');

    user.email = email;
    user.firstName = firstName;
    user.lastName = lastName;
    user.school = school;
    user.interests = interests;
    await user.save();
  }

  async updateUserWithPassword (username, password, email, firstName, lastName, school, interests) {
    const user = await User.findOne({ username });
    if (!user) throw new ResponseError(400, 'user not found');
    
    user.password = await AuthService.hashPassword(password);
    user.email = email;
    user.firstName = firstName;
    user.lastName = lastName;
    user.school = school;
    user.interests = interests;
    await user.save();
  }

  async updateMeterEXP (user_id, action) {
    const user = await User.findById(user_id);
    if (!user) throw new ResponseError(400, 'user not found');

    if (user.type === 'teacher') {
      switch (action) {
        case 'createPost':
          user.meterEXP += 20;
          break;
        case 'replyPost':
          user.meterEXP += 10;
          break;
        case 'publishCourse':
          user.meterEXP += 50;
          break;
      }
    } else if (user.type === 'parent') {
      switch (action) {
        case 'createPost':
          user.meterEXP += 20;
          break;
        case 'replyPost':
          user.meterEXP += 10;
          break;
      }
    } else if (user.type === 'student') {
      switch (action) {
        case 'playMagicCube':
          user.meterEXP += 30;
          break;
        case 'playSolveThem':
          user.meterEXP += 10;
          break;
        case 'createPost':
          user.meterEXP += 10;
          break;
        case 'replyPost':
          user.meterEXP += 5;
          break;
      }
    }
    await user.save();
  }

  async updateUserMeterLevel (userId, level) {
    const user = await User.findById(userId);
    if (!user) throw new ResponseError(400, 'user not found');

    user.meterLevel = level;
    await user.save()
  }

  async followUser (_requestorId, _targetId) {
    const [ target, self ] = await Promise.all([
      User.updateOne(
        { _id: _targetId },
        { $addToSet: { followers: _requestorId } }
      ),
      User.updateOne(
        { _id: _requestorId },
        { $addToSet: { following: _targetId } }
      )
    ]);
    if (!target.nModified || !self.nModified) {
      throw new ResponseError(400, 'cannot follow user');
    }
  }

  async unfollowUser (_requestorId, _targetId) {
    const [ target, self ] = await Promise.all([
      User.updateOne(
        { _id: _targetId },
        { $pull: { followers: _requestorId } }
      ),
      User.updateOne(
        { _id: _requestorId },
        { $pull: { following: _targetId } }
      )
    ]);
    if (!target.nModified || !self.nModified) {
      throw new ResponseError(400, 'cannot unfollow user');
    }
  }

  async getUpdates (_userId) {
    const { following, lastUpdateCheck } = await User
      .findById(_userId)
      .select('following lastUpdateCheck')
      .lean();

    const checkTime = new Date(lastUpdateCheck);
    const backTime = (Date.now() - checkTime.getTime()) / 1000 < (3600 * 12)
      ? new Date(Date.now() - (3600 * 12 * 1000))
      : lastUpdateCheck;
    
    const [ posts, courses ] = await Promise.all([
      Post.find({ author: { $in: following }, createdAt: { $gte: backTime } }),
      Course.find({ author: { $in: following }, published: true, publishedAt: { $gte: backTime } })
    ]);
    
    const recentUpdatesByUser = {};
    posts.forEach(({ _id, author, title: name, content, tags, createdAt: timestamp }) => {
      const newPost = {
        _id,
        name,
        content,
        tags,
        timestamp,
        type: 'Post'
      };
      recentUpdatesByUser[author]
        ? recentUpdatesByUser[author].push(newPost)
        : recentUpdatesByUser[author] = [ newPost ]
    });
    courses.forEach(({ _id, author, name, description: content, tags, publishedAt: timestamp }) => {
      const newCourse = {
        _id,
        name,
        content,
        tags,
        timestamp,
        type: 'Course'
      };
      recentUpdatesByUser[author] 
        ? recentUpdatesByUser[author].push(newCourse)
        : recentUpdatesByUser[author]  = [ newCourse ]
    });

    const userDetails = await User
      .find({ _id: Object.keys(recentUpdatesByUser) })
      .select('username avatar')
      .lean();
    
    const recentUpdates = userDetails.map(({ _id, username, avatar }) => ({
      _id,
      username,
      avatar,
      activities: recentUpdatesByUser[_id]
    }));

    await User.updateOne({ _id: _userId }, { lastUpdateCheck: new Date });

    return recentUpdates;
  }
}

module.exports = new UserService();