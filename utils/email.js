const nodemailer = require('nodemailer');

async function sendmail(options) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    secure: true,
    port: process.env.SMTP_PORT,
    auth: {
      user: 'resend',
      pass: process.env.EMAIL_API_KEY,
    },
  });

  const info = await transporter.sendMail({
    from: 'onboarding@resend.dev',
    to: options.to,
    subject: options.subject,
    html: `<p>${options.body}</p>`,
  });

  console.log('Message sent: %s', info.messageId);
}

module.exports = sendmail;


