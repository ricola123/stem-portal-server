const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const Token = require('../models/tokens');
const User = require('../models/users');

const EmailService = require('./email');

const { ResponseError } = require('../utils');

class AuthService {
  async sendRegisterToken (userId, username, email) {
    const { token } = await this.issueVerifyToken(userId);
    await EmailService.sendVerifyRegisterEmail(email, username, token);
  }

  async resendRegisterToken (username, email) {
    const user = await User.findOne({ username, email });
    if (!user) throw new ResponseError(400, 'failed to resend link to user: not found');
    if (user.type !== 'inactive') throw new ResponseError(400, 'account already activated');

    const { token } = await this.issueVerifyToken(user._id, true);
    await EmailService.sendVerifyRegisterEmail(email, username, token);
    return user;
  }

  async revokeRegisterToken (username, token) {
    const user = await User.findOne({ username });
    if (!user) throw new ResponseError(400, 'failed to revoke token for user: not found');
    if (user.type !== 'inactive') throw new ResponseError(400, 'account already activated');
    await Token.findOneAndDelete({ _userId: user._id, token });
  }

  async verifyRegisterToken (username, token) {
    const user = await User.findOne({ username });
    if (!user) throw new ResponseError(400, 'failed to verify token for user: not found');
    if (user.type !== 'inactive') throw new ResponseError(400, 'account already activated');

    const targetToken = await Token.findOne({ _userId: user._id, token });
    if (!targetToken) throw new ResponseError(400, 'invalid or expired token');

    user.type = 'verified';
    await user.save();
  }

  async activateUser (username, role, firstName, lastName, gender, school, interests) {
    await User.updateOne({ username }, { type: role, firstName, lastName, gender, school, interests });
  }

  async loginUser (username, password) {
    const user = await User.findOne({ username }).select('-__v');
    if (!user) throw new ResponseError(401, 'incorrect username or password');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new ResponseError(401, 'incorrect username or password');

    const jwt = this.issueJsonWebToken(user._id, user.username, user.type);
    user.set('password', undefined);
    return { user, jwt };
  }
  
  async resetPassword (username, password, token) {
    const user = await User.findOne({ username });
    if (!user) throw new ResponseError(400, 'user not found');

    const resetToken = await Token.findOneAndDelete({ _userId: user._id, token });
    if (!resetToken) throw new ResponseError(400, 'invalid token');

    user.password = await this.hashPassword(password);
    await user.save();
  }

  async issueResetPasswordToken (username, email) {
    const user = await User.findOne({ username, email });
    if (!user) throw new ResponseError(400, 'incorrect account details');

    const token = await this.issueVerifyToken(user._id);
    await EmailService.sendResetPasswordEmail(email, username, token);
  }

  async issueVerifyToken (userId, deleteOld = false) {
    if (deleteOld) await Token.deleteOne({ _userId: userId });
    const token = new Token({ _userId: userId, token: crypto.randomBytes(16).toString('hex') });
    await token.save();
    return token;
  }

  issueJsonWebToken (id, username, type) {
    const payload = { id, username, type };
    const options = { expiresIn: '7d', issuer: 'https://www.stem-portal.hk' };
    const secret = process.env.JWT_SECRET;

    const token = jwt.sign(payload, secret, options);
    return token;
  }

  async hashPassword (password) {
    const saltRounds = parseInt(process.env.SALT_ROUNDS);
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword (raw, hashed) {
    return bcrypt.compare(raw, hashed);
  }
}

module.exports = new AuthService();