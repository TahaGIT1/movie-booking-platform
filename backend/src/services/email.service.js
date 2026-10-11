import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Initialize Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(env.SMTP_PORT || '465', 10),
  secure: (env.SMTP_SECURE === 'true' || env.SMTP_PORT === '465'),
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

/**
 * Common HTML email wrapper for CineVerse branding
 */
const getEmailWrapper = ({ title, preheader, contentHtml }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #08090c;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #08090c;
      padding: 40px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: linear-gradient(180deg, #12141c 0%, #0d0f15 100%);
      border: 1px solid #232735;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      padding: 32px 32px 24px 32px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .logo {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #ffffff;
      text-decoration: none;
    }
    .logo-dot {
      color: #eab308;
    }
    .tagline {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 6px;
      font-weight: 600;
    }
    .content {
      padding: 32px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px 0;
      text-align: center;
    }
    .subtitle {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
      margin: 0 0 24px 0;
      text-align: center;
    }
    .otp-card {
      background: rgba(234, 179, 8, 0.06);
      border: 1.5px dashed rgba(234, 179, 8, 0.4);
      border-radius: 16px;
      padding: 24px 16px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-code {
      font-family: 'SF Mono', Consolas, Monaco, 'Courier New', monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #eab308;
      padding-left: 10px;
      margin: 0;
      display: inline-block;
    }
    .otp-expiry {
      font-size: 12px;
      color: #cbd5e1;
      margin-top: 10px;
      font-weight: 500;
    }
    .security-notice {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 16px;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
      margin-top: 24px;
    }
    .security-notice strong {
      color: #f1f5f9;
    }
    .footer {
      padding: 24px 32px 32px 32px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#08090c;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">CineVerse<span class="logo-dot">.</span></div>
        <div class="tagline">Next-Gen Cinema Experience</div>
      </div>
      
      <div class="content">
        ${contentHtml}
      </div>

      <div class="footer">
        This automated email was sent from CineVerse Secure Authentication Service.<br>
        &copy; ${new Date().getFullYear()} CineVerse Entertainment Inc. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Send OTP email for Account Verification (Signup)
 */
export const sendSignupOtpEmail = async ({ toEmail, otp, fullName = 'Movie Lover' }) => {
  const contentHtml = `
    <h1 class="title">Verify Your Email Address</h1>
    <p class="subtitle">
      Hi <strong>${fullName}</strong>, welcome to CineVerse! Please use the 6-digit one-time verification code below to complete your registration.
    </p>

    <div class="otp-card">
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏱️ This code expires in <strong>10 minutes</strong></div>
    </div>

    <div class="security-notice">
      <strong>🔒 Security Advisory:</strong><br>
      Please do not share this one-time code with anyone. CineVerse representatives will never ask you for your verification code. If you did not create an account on CineVerse, you can safely ignore this email.
    </div>
  `;

  const html = getEmailWrapper({
    title: 'Verify your CineVerse account',
    preheader: `Your CineVerse verification code is ${otp}. Valid for 10 minutes.`,
    contentHtml
  });

  const mailOptions = {
    from: `"CineVerse" <${env.SMTP_USER}>`,
    to: toEmail,
    subject: `🎬 [CineVerse] Your Verification Code: ${otp}`,
    text: `Hi ${fullName},\n\nWelcome to CineVerse! Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nNever share this code with anyone.`,
    html
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send OTP email for Password Reset (Forgot Password)
 */
export const sendForgotPasswordOtpEmail = async ({ toEmail, otp, fullName = 'Movie Lover' }) => {
  const contentHtml = `
    <h1 class="title">Password Reset Request</h1>
    <p class="subtitle">
      Hi <strong>${fullName}</strong>, we received a request to reset your CineVerse account password. Use the 6-digit security code below to reset it.
    </p>

    <div class="otp-card">
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏱️ This security code expires in <strong>10 minutes</strong></div>
    </div>

    <div class="security-notice">
      <strong>🔒 Security Notice:</strong><br>
      If you did not request a password reset, please ignore this email or review your account security immediately. Your current password remains safe and unchanged until you confirm with this OTP.
    </div>
  `;

  const html = getEmailWrapper({
    title: 'Reset your CineVerse password',
    preheader: `Your CineVerse password reset code is ${otp}. Valid for 10 minutes.`,
    contentHtml
  });

  const mailOptions = {
    from: `"CineVerse Security" <${env.SMTP_USER}>`,
    to: toEmail,
    subject: `🔐 [CineVerse] Password Reset Code: ${otp}`,
    text: `Hi ${fullName},\n\nWe received a request to reset your CineVerse account password.\n\nYour security code is: ${otp}\n\nThis code is valid for 10 minutes. If you did not make this request, you can safely ignore this message.`,
    html
  };

  return await transporter.sendMail(mailOptions);
};

export default {
  sendSignupOtpEmail,
  sendForgotPasswordOtpEmail
};
