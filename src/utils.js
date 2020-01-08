const mailgun = require('mailgun-js');
const jwt = require('jsonwebtoken');

module.exports = {
  validateToken: (req, res, next) => {
    const authorizationHeaader = req.headers.authorization;
    let result;
    if (authorizationHeaader) {
      const token = req.headers.authorization.split(' ')[1]; // Bearer <token>
      const options = {
        expiresIn: '2d',
        issuer: 'https://www.stem-portal.hk'
      };
      try {
        // verify makes sure that the token hasn't expired and has been issued by us
        result = jwt.verify(token, process.env.JWT_SECRET, options);

        // Let's pass back the decoded token to the request object
        req.decoded = result;
        // We call next to pass execution to the subsequent middleware
        next();
      } catch (err) {
        // Throw an error just in case anything goes wrong with verification
        throw new Error(err);
      }
    } else {
      result = { 
        error: `Authentication error. Token required.`,
        status: 401
      };
      res.status(401).send(result);
    }
  },
  sendVerifyEmail: (user, token) => {
    const key = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const mg = mailgun({ apiKey: key, domain });
  
    const data = {
      from: 'STEM Portal Robot <no-reply@stem-portal.hk>',
      to: user.email,
      subject: 'Activate Your STEM Portal Account Here',
      template: 'verify-account-email', //email template is on mailgun server 
      'v:name': user.username,
      'v:token': token
    };
    mg.messages().send(data).then((err, body) => { console.log(err || body) });
  }
};