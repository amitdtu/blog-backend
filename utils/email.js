const nodemailer = require('nodemailer');

const sendEmail = (options) => {
  // 1 create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD, // naturally, replace both with your real credentials or an application-specific password
    },
  });

  // 2 define the email options
  const mailOptions = {
    from: 'amitmern@gamil.com',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3 send the email
  transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
