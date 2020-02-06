const User = require('../models/users');

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
     
    user = new User({ username, password, email, type: 'inactive' });
    await user.save();
    return await User.findById(user._id).select('-__v -password');
  }

  async updatePassword (userId, curPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) throw new ResponseError(400, 'user not found');

    const match = await AuthService.comparePassword(curPassword, user.password);  
    if (!match) throw new ResponseError(400, 'cannot update password: wrong current password');

    user.password = await AuthService.hashPassword(newPassword);
    await user.save();
  }
}

module.exports = new UserService();