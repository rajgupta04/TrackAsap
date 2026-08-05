import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const getBaseHtml = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background-color: #0a0a0f;
      color: #ffffff;
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      color: #39ff14;
      font-size: 28px;
      font-weight: bold;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    .card {
      background-color: #15151a;
      border: 1px solid #232329;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
    h1 {
      color: #ffffff;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
      font-weight: 600;
    }
    p {
      color: #a0a0b0;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .btn {
      display: inline-block;
      background-color: #39ff14;
      color: #000000;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin-top: 10px;
      transition: background-color 0.3s;
    }
    .btn:hover {
      background-color: #32e011;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: #606070;
      font-size: 14px;
    }
    .highlight {
      color: #39ff14;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${process.env.FRONTEND_URL}" class="logo">TrackAsap</a>
    </div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} TrackAsap. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

export const sendVerificationEmail = async (user, token) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  const content = `
    <h1>Verify Your Email</h1>
    <p>Hi ${user.name},</p>
    <p>Welcome to TrackAsap! To get started and secure your account, please verify your email address by clicking the button below.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" class="btn">Verify Email Address</a>
    </div>
    <p style="font-size: 14px;">If you didn't create an account with us, you can safely ignore this email.</p>
  `;

  const html = getBaseHtml('Verify Your Email — TrackAsap', content);

  await transporter.sendMail({
    from: `"TrackAsap" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: 'Verify Your Email — TrackAsap',
    html,
  });
};

export const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();

  const content = `
    <h1>Welcome to TrackAsap! 🚀</h1>
    <p>Hi ${user.name},</p>
    <p>I'm Raj, and I want to personally welcome you to TrackAsap! I built this platform to help developers like you stay consistent and crush their goals.</p>
    <p>Here are a few things you can do right away:</p>
    <ul style="color: #a0a0b0; font-size: 16px; line-height: 1.6; padding-left: 20px; margin-bottom: 20px;">
      <li><strong class="highlight">Sync Your Profiles:</strong> Connect your LeetCode and CodeChef accounts to track your progress automatically.</li>
      <li><strong class="highlight">Curated Sheets:</strong> Import our carefully crafted company sheets to start practicing top interview questions.</li>
      <li><strong class="highlight">Daily Tracker:</strong> Log your daily progress, stay accountable, and build an unbreakable streak.</li>
      <li><strong class="highlight">Code Playground:</strong> Use our embedded code playground to write and test code without leaving the platform.</li>
    </ul>
    <p>We're thrilled to have you onboard. Let's make every day count!</p>
    <p>Best,<br>Raj from TrackAsap</p>
  `;

  const html = getBaseHtml('Welcome to TrackAsap! 🚀', content);

  await transporter.sendMail({
    from: `"Raj from TrackAsap" <${process.env.WELCOME_FROM_EMAIL || process.env.SMTP_USER}>`,
    to: user.email,
    subject: 'Welcome to TrackAsap! 🚀',
    html,
  });
};

export const sendResetPasswordEmail = async (user, token) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const content = `
    <h1>Reset Your Password</h1>
    <p>Hi ${user.name},</p>
    <p>You requested a password reset for your TrackAsap account. Please click the button below to proceed. This link is only valid for 15 minutes.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <p style="font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
  `;

  const html = getBaseHtml('Reset Your Password — TrackAsap', content);

  await transporter.sendMail({
    from: `"TrackAsap" <admin@trackasap.in>`,
    to: user.email,
    subject: 'Reset Your Password — TrackAsap',
    html,
  });
};
