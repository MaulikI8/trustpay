const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('📬 Email Service: Initializing with user:', process.env.EMAIL_USER ? '✅ Loaded' : '❌ NOT FOUND');
console.log('📬 Email Service: Initializing with pass:', process.env.EMAIL_PASS ? '✅ Loaded' : '❌ NOT FOUND');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  }
});

const sendWelcomeEmail = async (email, full_name) => {
  try {
    const mailOptions = {
      from: `"TrustPay Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to TrustPay! 🚀',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">TrustPay</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #2563eb;">Hello ${full_name},</h2>
              <p>Welcome to <strong>TrustPay</strong>! Your registration was successful and your account is ready to use.</p>
              
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #1e293b;">Security Reminder:</p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Your account is secured with your 4-digit <strong>Security PIN</strong>.</li>
                  <li>Never share your PIN or Email with anyone.</li>
                  <li>TrustPay will never ask for your PIN via email or phone call.</li>
                </ul>
              </div>

              <p>Happy transacting!</p>
              
              <p style="margin-top: 30px;">Best Regards,<br/><strong>The TrustPay Team</strong></p>
            </div>
            <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
              &copy; 2026 TrustPay. All rights reserved.
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 SUCCESS: Welcome email sent to ${email} (ID: ${info.messageId})`);
    
    return true; 
  } catch (error) {
    console.error(`❌ Mail Error: Failed to send email to ${email} -`, error.message);
    return false; 
  }
};

module.exports = {
  sendWelcomeEmail
};