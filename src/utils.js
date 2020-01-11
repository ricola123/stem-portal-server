const mailgun = require('mailgun-js');
const jwt = require('jsonwebtoken');

const key = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const mg = mailgun({ apiKey: key, domain });

module.exports = {
  validateToken: (req, res, next) => {
    const authorizationHeaader = req.headers.authorization;
    if (authorizationHeaader) {
      const token = authorizationHeaader.split(' ')[1]; // Bearer <token>
      const options = { expiresIn: '2d', issuer: 'https://www.stem-portal.hk' };
      try {
        const result = jwt.verify(token, process.env.JWT_SECRET, options);
        req.decoded = result;
        next();
      } catch (err) {
        console.log('validateToken err:', err);
        res.status(401).send({ error: 'Authorization error, valid token required.' });
      }
    }
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