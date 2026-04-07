// @ts-nocheck
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "The Hungry Paws <onboarding@resend.dev>"; // replace with your domain later

async function safeSend({ to, subject, html }) {
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    console.log(`✅ Email sent → ${to} | ${subject}`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Email failed → ${to} | ${subject}`, err.message);
    return { success: false, error: err.message };
  }
}

/* ═══════════════════════════════════════════
   EMAIL VERIFICATION
═══════════════════════════════════════════ */
async function sendVerificationEmail(email, token, fullName) {
  const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email/${token}`;
  return safeSend({
    to:      email,
    subject: "Verify Your Email - The Hungry Paws",
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <div style="background:#d44d7c;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;">🐾 The Hungry Paws</h1>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #f5d5d5;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#d44d7c;">Welcome, ${fullName}! 👋</h2>
          <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${verificationUrl}"
               style="background:#d44d7c;color:#fff;padding:13px 30px;text-decoration:none;border-radius:30px;font-weight:700;display:inline-block;">
              Verify Email
            </a>
          </div>
          <p style="font-size:0.85rem;color:#666;">Or paste this link in your browser:</p>
          <p style="font-size:0.82rem;color:#888;word-break:break-all;">${verificationUrl}</p>
          <p style="font-size:0.82rem;color:#999;margin-top:20px;">This link expires in 24 hours. If you did not create an account, ignore this email.</p>
        </div>
      </div>`,
  });
}

/* ═══════════════════════════════════════════
   PASSWORD RESET
═══════════════════════════════════════════ */
async function sendPasswordResetEmail(email, token, fullName) {
  const resetUrl = `${process.env.BASE_URL}/reset-password.html?token=${token}`;
  return safeSend({
    to:      email,
    subject: "Reset Your Password - The Hungry Paws",
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <div style="background:#d44d7c;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;">🔐 Password Reset</h1>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #f5d5d5;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#d44d7c;">Hi ${fullName},</h2>
          <p>We received a request to reset your password. Click the button below to set a new one:</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${resetUrl}"
               style="background:#d44d7c;color:#fff;padding:13px 30px;text-decoration:none;border-radius:30px;font-weight:700;display:inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size:0.85rem;color:#666;">Or paste this link in your browser:</p>
          <p style="font-size:0.82rem;color:#888;word-break:break-all;">${resetUrl}</p>
          <p style="font-size:0.82rem;color:#999;margin-top:20px;">This link expires in 1 hour. If you did not request this, you can safely ignore it.</p>
        </div>
      </div>`,
  });
}

/* ═══════════════════════════════════════════
   PASSWORD CHANGED NOTIFICATION
═══════════════════════════════════════════ */
async function sendPasswordChangedEmail(email, fullName) {
  return safeSend({
    to:      email,
    subject: "Password Changed Successfully - The Hungry Paws",
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <div style="background:#059669;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;">✅ Password Changed</h1>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #d1fae5;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#065f46;">Hi ${fullName},</h2>
          <p>Your password has been changed successfully.</p>
          <p style="font-size:0.88rem;color:#666;">If you did not make this change, please contact us immediately by replying to this email.</p>
          <p style="font-size:0.82rem;color:#999;margin-top:20px;">— The Hungry Paws Team</p>
        </div>
      </div>`,
  });
}

/* ═══════════════════════════════════════════
   USER BOOKING — RECEIVED (PENDING)
═══════════════════════════════════════════ */
async function sendUserBookingReceived(booking, user, pets) {
  const petNames = pets.map(p => p.name).join(", ");
  const isHotel  = booking.type === "hotel";
  return safeSend({
    to:      user.email,
    subject: "📋 Booking Request Received - The Hungry Paws",
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <div style="background:#d44d7c;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;">🐾 The Hungry Paws</h1>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #f5d5d5;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#d44d7c;">Hi ${user.fullName}! 👋</h2>
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
              ${booking.requestedGroomerName ? `<tr><td style="padding:4px 0;color:#666;">Groomer Request</td><td>${booking.requestedGroomerName} <span style="color:#aaa;font-size:0.8rem;">(subject to availability)</span></td></tr>` : ""}
            </table>
          </div>
          <p style="font-size:0.88rem;color:#666;">We'll send another email once your booking is <strong>approved</strong> or if there are updates.</p>
          <p style="font-size:0.8rem;color:#999;">Ref #: <strong>${booking._id}</strong></p>
        </div>
      </div>`,
  });
}

/* ═══════════════════════════════════════════
   USER BOOKING — APPROVED
═══════════════════════════════════════════ */
async function sendUserBookingApproved(booking, user, pets) {
  const petNames = pets.map(p => p.name).join(", ");
  const isHotel  = booking.type === "hotel";
  return safeSend({
    to:      user.email,
    subject: "✅ Booking Approved - The Hungry Paws",
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <div style="background:#059669;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;">✅ Booking Approved!</h1>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #d1fae5;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#065f46;">Great news, ${user.fullName}! 🎉</h2>
          <p>Your ${isHotel ? "hotel stay" : "grooming appointment"} for <strong>${petNames}</strong> is confirmed.</p>
          <div style="background:#d1fae5;border-radius:8px;padding:16px;margin:20px 0;">
            <table style="width:100%;font-size:0.9rem;border-collapse:collapse;">
              ${booking.services ? `<tr><td style="padding:4px 0;color:#555;">Services</td><td>${Array.isArray(booking.services) ? booking.services.join(", ") : booking.services}</td></tr>` : ""}
              <tr><td style="padding:4px 0;color:#555;">${isHotel ? "Check-in" : "Date"}</td><td><strong>${new Date(booking.appointmentDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</strong></td></tr>
              <tr><td style="padding:4px 0;color:#555;">Time</td><td><strong>${booking.appointmentTime}</strong></td></tr>
              ${isHotel && booking.hotelCheckoutDate ? `<tr><td style="padding:4px 0;color:#555;">Check-out</td><td><strong>${new Date(booking.hotelCheckoutDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} ${booking.hotelCheckoutTime || ""}</strong></td></tr>` : ""}
            </table>
          </div>
          <div style="background:#fef3c7;border-radius:8px;padding:14px;margin:16px 0;font-size:0.88rem;">
            <strong>📍 Please remember:</strong><br/>
            • Payment is made <strong>at the shop</strong> upon arrival<br/>
            • Prices may vary by pet size, fur condition, and services<br/>
            • Please arrive on time
          </div>
          <p style="font-size:0.8rem;color:#999;">Ref #: <strong>${booking._id}</strong></p>
        </div>
      </div>`,
  });
}

/* ═══════════════════════════════════════════
   USER BOOKING — REJECTED
═══════════════════════════════════════════ */
async function sendUserBookingRejected(booking, user, pets, reason) {
  const petNames = pets.map(p => p.name).join(", ");
  return safeSend({
    to:      user.email,
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
          <p style="font-size:0.88rem;color:#555;">Please feel free to book again at a different date or time. We'd love to see ${petNames} at the shop!</p>
          <p style="font-size:0.8rem;color:#999;">Ref #: <strong>${booking._id}</strong></p>
        </div>
      </div>`,
  });
}

/* ═══════════════════════════════════════════
   GUEST BOOKING — RECEIVED (PENDING)
═══════════════════════════════════════════ */
async function sendGuestBookingReceived(booking) {
  return safeSend({
    to:      booking.email,
    subject: "📋 Booking Request Received - The Hungry Paws",
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <div style="background:#d44d7c;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;">🐾 The Hungry Paws</h1>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #f5d5d5;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#d44d7c;">Hi ${booking.ownerName}! 👋</h2>
          <p>Your grooming booking request has been received and is currently <strong>PENDING</strong>.</p>
          <div style="background:#fce7f0;border-radius:8px;padding:16px;margin:20px 0;">
            <h3 style="margin:0 0 12px;color:#9d174d;">Booking Details</h3>
            <table style="width:100%;font-size:0.9rem;border-collapse:collapse;">
              <tr><td style="padding:4px 0;color:#666;">Pet Name</td><td><strong>${booking.petName}</strong></td></tr>
              <tr><td style="padding:4px 0;color:#666;">Breed</td><td>${booking.breed}</td></tr>
              <tr><td style="padding:4px 0;color:#666;">Services</td><td>${Array.isArray(booking.services) ? booking.services.join(", ") : booking.services}</td></tr>
              <tr><td style="padding:4px 0;color:#666;">Date</td><td>${new Date(booking.appointmentDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</td></tr>
              <tr><td style="padding:4px 0;color:#666;">Time</td><td>${booking.appointmentTime}</td></tr>
              ${booking.requestedGroomerName ? `<tr><td style="padding:4px 0;color:#666;">Groomer</td><td>${booking.requestedGroomerName} (subject to availability)</td></tr>` : ""}
            </table>
          </div>
          <p style="font-size:0.88rem;color:#666;">You'll receive another email once your booking is approved or rejected.</p>
          <p style="font-size:0.8rem;color:#999;">Ref #: <strong>${booking._id || booking.refNo}</strong></p>
        </div>
      </div>`,
  });
}

/* ═══════════════════════════════════════════
   GUEST BOOKING — APPROVED
═══════════════════════════════════════════ */
async function sendGuestBookingApproved(booking) {
  return safeSend({
    to:      booking.email,
    subject: "✅ Booking Approved - The Hungry Paws",
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <div style="background:#059669;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;">✅ Booking Approved!</h1>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #d1fae5;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#065f46;">Great news, ${booking.ownerName}! 🎉</h2>
          <p>Your appointment for <strong>${booking.petName}</strong> is confirmed.</p>
          <div style="background:#d1fae5;border-radius:8px;padding:16px;margin:20px 0;">
            <table style="width:100%;font-size:0.9rem;border-collapse:collapse;">
              <tr><td style="padding:4px 0;color:#555;">Services</td><td>${Array.isArray(booking.services) ? booking.services.join(", ") : booking.services}</td></tr>
              <tr><td style="padding:4px 0;color:#555;">Date</td><td><strong>${new Date(booking.appointmentDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</strong></td></tr>
              <tr><td style="padding:4px 0;color:#555;">Time</td><td><strong>${booking.appointmentTime}</strong></td></tr>
            </table>
          </div>
          <div style="background:#fef3c7;border-radius:8px;padding:14px;margin:16px 0;font-size:0.88rem;">
            <strong>📍 Please remember:</strong><br/>
            • Payment is made <strong>at the shop</strong> upon arrival<br/>
            • Prices may vary by pet size and fur condition<br/>
            • Please arrive on time for your appointment
          </div>
          <p style="font-size:0.8rem;color:#999;">Ref #: <strong>${booking._id || booking.refNo}</strong></p>
        </div>
      </div>`,
  });
}

/* ═══════════════════════════════════════════
   GUEST BOOKING — REJECTED
═══════════════════════════════════════════ */
async function sendGuestBookingRejected(booking, reason) {
  return safeSend({
    to:      booking.email,
    subject: "❌ Booking Update - The Hungry Paws",
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <div style="background:#dc2626;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;">Booking Update</h1>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #fee2e2;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#991b1b;">Hi ${booking.ownerName},</h2>
          <p>Unfortunately, we're unable to accommodate your booking for <strong>${booking.petName}</strong> on ${new Date(booking.appointmentDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}.</p>
          ${reason ? `<div style="background:#fee2e2;border-radius:8px;padding:14px;margin:16px 0;font-size:0.88rem;"><strong>Reason:</strong> ${reason}</div>` : ""}
          <p style="font-size:0.88rem;color:#555;">Please feel free to book again at a different date or time. We'd love to see ${booking.petName} at the shop!</p>
          <p style="font-size:0.8rem;color:#999;">Ref #: <strong>${booking._id || booking.refNo}</strong></p>
        </div>
      </div>`,
  });
}

/* ═══════════════════════════════════════════
   EXPORTS
═══════════════════════════════════════════ */
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