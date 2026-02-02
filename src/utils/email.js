const nodemailer = require("nodemailer");

/**
 * Create email transporter
 * Initialized lazily to handle missing credentials gracefully
 */
let transporter = null;

function getTransporter() {
  if (!transporter) {
    try {
      // DEBUG: Check if credentials exist
      console.log("EMAIL_USER:", process.env.EMAIL_USER);
      console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
      console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length);

      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } catch (error) {
      console.error("Failed to create email transporter:", error);
      throw error;
    }
  }
  return transporter;
}

/**
 * Send email verification
 */
async function sendVerificationEmail(email, token, fullName) {
  try {
    const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email/${token}`;

    const mailOptions = {
      from: `"The Hungry Paws" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - The Hungry Paws",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff69b4;">Welcome to The Hungry Paws! 🐾</h2>
          <p>Hi ${fullName},</p>
          <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #ff69b4; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
    };

    const transport = getTransporter();
    await transport.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending verification email:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, token, fullName) {
  try {
    const resetUrl = `${process.env.BASE_URL}/reset-password.html?token=${token}`;

    const mailOptions = {
      from: `"The Hungry Paws" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password - The Hungry Paws",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff69b4;">Password Reset Request 🔐</h2>
          <p>Hi ${fullName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #ff69b4; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
      `,
    };

    const transport = getTransporter();
    await transport.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending password reset email:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send password changed notification
 */
async function sendPasswordChangedEmail(email, fullName) {
  try {
    const mailOptions = {
      from: `"The Hungry Paws" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Changed Successfully - The Hungry Paws",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff69b4;">Password Changed ✅</h2>
          <p>Hi ${fullName},</p>
          <p>Your password has been changed successfully.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            The Hungry Paws Team
          </p>
        </div>
      `,
    };

    const transport = getTransporter();
    await transport.sendMail(mailOptions);
    console.log(`✅ Password changed email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending password changed email:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};
