const mailgun = require('mailgun-js');

const key = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const mg = mailgun({ apiKey: key, domain });

class EmailService {
  constructor () {
    this.from = 'STEM Portal Robot <no-reply@stem-portal.hk>'
  }

  async sendVerifyRegisterEmail (email, username, token) {
    const data = {
      from: this.from,
      to: email,
      subject: 'Activate Your STEM Portal Account Here',
      template: 'verify-account-email',
      'v:name': username,
      'v:token': token
    };
    await mg.messages().send(data);
  }
  
  async sendResetPasswordEmail (email, username, token) {
    const data = {
      from: this.from,
      to: email,
      subject: 'Reset Your STEM Portal Account Password Here',
      template: 'reset-password-email',
      'v:name': username,
      'v:token': token
    };
    await mg.messages().send(data);
  }
}

module.exports = new EmailService();