const nodemailer = require('nodemailer');
const ENV = require('./env.config');

const transporter = nodemailer.createTransport({
  host: ENV.EMAIL.HOST,
  port: ENV.EMAIL.PORT,
  secure: false,
  auth: {
    user: ENV.EMAIL.USER,
    pass: ENV.EMAIL.PASS,
  },
});

module.exports = transporter;