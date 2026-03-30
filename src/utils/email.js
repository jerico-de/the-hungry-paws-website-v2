const nodemailer = require("nodemailer");

/**
 * Create email transporter
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
        port: 587,
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

/**
 * Send registered user booking received (pending confirmation)
 */
async function sendUserBookingReceived(booking, user, pets) {
  try {
    const petNames = pets.map(p => p.name).join(", ");
    const isHotel  = booking.type === "hotel";

    const mailOptions = {
      from: `"The Hungry Paws" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "📋 Booking Request Received - The Hungry Paws",
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
          <div style="background:#d44d7c;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:1.4rem;">🐾 The Hungry Paws</h1>
          </div>

          <div style="background:#fff;padding:28px;border:1px solid #f5d5d5;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="color:#d44d7c;margin-top:0;">Hi ${user.fullName}! 👋</h2>
            <p>Your ${isHotel ? "hotel" : "grooming"} booking request has been received and is currently <strong>PENDING</strong> review.</p>

            <div style="background:#fce7f0;border-radius:8px;padding:16px;margin:20px 0;">
              <h3 style="margin:0 0 12px;color:#9d174d;">Booking Details</h3>
              <table style="width:100%;font-size:0.9rem;border-collapse:collapse;">
                <tr><td style="padding:4px 0;color:#666;">Pet(s)</td><td><strong>${petNames}</strong></td></tr>
                ${!isHotel && booking.services ? `<tr><td style="padding:4px 0;color:#666;">Services</td><td>${Array.isArray(booking.services) ? booking.services.join(", ") : booking.services}</td></tr>` : ""}
                ${isHotel ? `<tr><td style="padding:4px 0;color:#666;">Stay Type</td><td>Pet Hotel</td></tr>` : ""}
                <tr><td style="padding:4px 0;color:#666;">${isHotel ? "Check-in Date" : "Date"}</td><td>${new Date(booking.appointmentDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</td></tr>
                <tr><td style="padding:4px 0;color:#666;">${isHotel ? "Check-in Time" : "Time"}</td><td>${booking.appointmentTime}</td></tr>
                ${isHotel && booking.hotelCheckoutDate ? `<tr><td style="padding:4px 0;color:#666;">Check-out</td><td>${new Date(booking.hotelCheckoutDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} ${booking.hotelCheckoutTime || ""}</td></tr>` : ""}
                ${booking.requestedGroomerName ? `<tr><td style="padding:4px 0;color:#666;">Groomer Request</td><td>${booking.requestedGroomerName} <span style="color:#888;font-size:0.8rem;">(subject to availability)</span></td></tr>` : ""}
              </table>
            </div>

            <p style="font-size:0.9rem;color:#666;">
              We'll send you another email once your booking is <strong>approved</strong> or if there are any updates.
            </p>

            <p style="font-size:0.8rem;color:#999;">
              Ref #: <strong>${booking._id}</strong>
            </p>
          </div>
        </div>
      `,
    };

    const transport = getTransporter();
    await transport.sendMail(mailOptions);
    console.log(`✅ User booking received email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending user booking received email:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send registered user booking approved
 */
async function sendUserBookingApproved(booking, user, pets) {
  try {
    const petNames = pets.map(p => p.name).join(", ");
    const mailOptions = {
      from: `"The Hungry Paws" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "✅ Booking Approved - The Hungry Paws",
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
          <div style="background:#059669;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;">✅ Booking Approved!</h1>
          </div>
          <div style="background:#fff;padding:28px;border:1px solid #d1fae5;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="color:#065f46;">Great news, ${user.fullName}! 🎉</h2>
            <p>Your appointment for <strong>${petNames}</strong> is confirmed.</p>
            <div style="background:#d1fae5;border-radius:8px;padding:16px;margin:20px 0;">
              <table style="width:100%;font-size:0.9rem;">
                ${booking.services ? `<tr><td>Services</td><td>${Array.isArray(booking.services) ? booking.services.join(", ") : booking.services}</td></tr>` : ""}
                <tr><td>Date</td><td>${new Date(booking.appointmentDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</td></tr>
                <tr><td>Time</td><td>${booking.appointmentTime}</td></tr>
                ${booking.type === "hotel" ? `<tr><td>Check-out</td><td>${new Date(booking.hotelCheckoutDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} ${booking.hotelCheckoutTime}</td></tr>` : ""}
              </table>
            </div>
            <p style="font-size:0.9rem;">Please arrive on time. Payment will be handled at the shop.</p>
            <p style="font-size:0.8rem;color:#999;">Ref #: <strong>${booking._id}</strong></p>
          </div>
        </div>
      `,
    };

    const transport = getTransporter();
    await transport.sendMail(mailOptions);
    console.log(`✅ User booking approved email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending user booking approved email:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send registered user booking rejected
 */
async function sendUserBookingRejected(booking, user, pets, reason) {
  try {
    const petNames = pets.map(p => p.name).join(", ");
    const mailOptions = {
      from: `"The Hungry Paws" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "❌ Booking Update - The Hungry Paws",
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
          <div style="background:#dc2626;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;">Booking Update</h1>
          </div>
          <div style="background:#fff;padding:28px;border:1px solid #fee2e2;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="color:#991b1b;">Hi ${user.fullName},</h2>
            <p>We're unable to accommodate your booking for <strong>${petNames}</strong> on ${new Date(booking.appointmentDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}.</p>
            ${reason ? `<div style="background:#fee2e2;padding:12px;border-radius:6px;margin:15px 0;"><strong>Reason:</strong> ${reason}</div>` : ""}
            <p>Please feel free to book again at another time.</p>
            <p style="font-size:0.8rem;color:#999;">Ref #: <strong>${booking._id}</strong></p>
          </div>
        </div>
      `,
    };

    const transport = getTransporter();
    await transport.sendMail(mailOptions);
    console.log(`✅ User booking rejected email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending user booking rejected email:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send guest booking received (pending)
 */
async function sendGuestBookingReceived(booking) {
  try {
    const subject = "📋 Booking Request Received - The Hungry Paws";

    const mailOptions = {
      from: `"The Hungry Paws" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject,
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
          <div style="background:#d44d7c;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:1.4rem;">🐾 The Hungry Paws</h1>
          </div>

          <div style="background:#fff;padding:28px;border:1px solid #f5d5d5;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="color:#d44d7c;margin-top:0;">Hi ${booking.ownerName}! 👋</h2>
            <p>Your grooming booking request has been received and is currently <strong>PENDING</strong>.</p>

            <div style="background:#fce7f0;border-radius:8px;padding:16px;margin:20px 0;">
              <h3 style="margin:0 0 12px;color:#9d174d;">Booking Details</h3>
              <table style="width:100%;font-size:0.9rem;">
                <tr><td>Pet Name</td><td><strong>${booking.petName}</strong></td></tr>
                <tr><td>Breed</td><td>${booking.breed}</td></tr>
                <tr><td>Services</td><td>${Array.isArray(booking.services) ? booking.services.join(", ") : booking.services}</td></tr>
                <tr><td>Date</td><td>${new Date(booking.appointmentDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</td></tr>
                <tr><td>Time</td><td>${booking.appointmentTime}</td></tr>
                ${
                  booking.requestedGroomerName
                    ? `<tr><td>Groomer</td><td>${booking.requestedGroomerName} (subject to availability)</td></tr>`
                    : ""
                }
              </table>
            </div>

            <p style="font-size:0.9rem;color:#666;">
              You’ll receive another email once your booking is approved or rejected.
            </p>

            <p style="font-size:0.8rem;color:#999;">
              Ref #: <strong>${booking._id || booking.refNo}</strong>
            </p>
          </div>
        </div>
      `,
    };

    const transport = getTransporter();
    await transport.sendMail(mailOptions);

    console.log(`✅ Booking received email sent to ${booking.email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending booking received email:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send guest booking approved
 */
async function sendGuestBookingApproved(booking) {
  try {
    const subject = "✅ Booking Approved - The Hungry Paws";

    const mailOptions = {
      from: `"The Hungry Paws" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject,
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
          <div style="background:#059669;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;">✅ Booking Approved!</h1>
          </div>

          <div style="background:#fff;padding:28px;border:1px solid #d1fae5;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="color:#065f46;">Great news, ${booking.ownerName}! 🎉</h2>
            <p>Your appointment for <strong>${booking.petName}</strong> is confirmed.</p>

            <div style="background:#d1fae5;border-radius:8px;padding:16px;margin:20px 0;">
              <table style="width:100%;font-size:0.9rem;">
                <tr><td>Services</td><td>${Array.isArray(booking.services) ? booking.services.join(", ") : booking.services}</td></tr>
                <tr><td>Date</td><td>${new Date(booking.appointmentDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</td></tr>
                <tr><td>Time</td><td>${booking.appointmentTime}</td></tr>
              </table>
            </div>

            <p style="font-size:0.9rem;">
              Please arrive on time. Payment will be handled at the shop.
            </p>

            <p style="font-size:0.8rem;color:#999;">
              Ref #: <strong>${booking._id || booking.refNo}</strong>
            </p>
          </div>
        </div>
      `,
    };

    const transport = getTransporter();
    await transport.sendMail(mailOptions);

    console.log(`✅ Booking approved email sent to ${booking.email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending booking approved email:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send guest booking rejected
 */
async function sendGuestBookingRejected(booking, reason) {
  try {
    const subject = "❌ Booking Update - The Hungry Paws";

    const mailOptions = {
      from: `"The Hungry Paws" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject,
      html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
          <div style="background:#dc2626;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;">Booking Update</h1>
          </div>

          <div style="background:#fff;padding:28px;border:1px solid #fee2e2;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="color:#991b1b;">Hi ${booking.ownerName},</h2>
            <p>We’re unable to accommodate your booking for <strong>${booking.petName}</strong> on ${new Date(booking.appointmentDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}.</p>

            ${
              reason
                ? `<div style="background:#fee2e2;padding:12px;border-radius:6px;margin:15px 0;">
                    <strong>Reason:</strong> ${reason}
                   </div>`
                : ""
            }

            <p>Please feel free to book again at another time.</p>

            <p style="font-size:0.8rem;color:#999;">
              Ref #: <strong>${booking._id || booking.refNo}</strong>
            </p>
          </div>
        </div>
      `,
    };

    const transport = getTransporter();
    await transport.sendMail(mailOptions);

    console.log(`✅ Booking rejected email sent to ${booking.email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending booking rejected email:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendUserBookingReceived,
  sendUserBookingApproved, 
  sendUserBookingRejected,
  sendGuestBookingReceived,
  sendGuestBookingApproved,
  sendGuestBookingRejected,
};