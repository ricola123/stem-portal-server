const mailgun = require('mailgun-js');
const jwt = require('jsonwebtoken');

const key = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const mg = mailgun({ apiKey: key, domain });

module.exports = {
  generateToken: (username, type) => {
    const payload = { username, type };
    const options = { expiresIn: '7d', issuer: 'https://www.stem-portal.hk' };
    const secret = process.env.JWT_SECRET;

    const token = jwt.sign(payload, secret, options);
    return token;
  },
  sendVerifyEmail: (user, token) => {
    const data = {
      from: 'STEM Portal Robot <no-reply@stem-portal.hk>',
      to: user.email,
      subject: 'Activate Your STEM Portal Account Here',
      template: 'verify-account-email', //email template is on mailgun server 
      'v:name': user.username,
      'v:token': token
    };
    mg.messages().send(data).then((err, body) => { console.log(err || body) });
  },
  sendResetPasswordEmail: (user, token) => {
    const data = {
      from: 'STEM Portal Robot <no-reply@stem-portal.hk>',
      to: user.email,
      subject: 'Reset Your STEM Portal Account Password Here',
      template: 'reset-password-email', //email template is on mailgun server 
      'v:name': user.username,
      'v:token': token
    };
    mg.messages().send(data).then((err, body) => { console.log(err || body) });
  }
};