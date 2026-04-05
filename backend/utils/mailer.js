const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (toEmail, otp, purpose) => {
  const subject = purpose === "verify" 
    ? "VisaPath — Verify Your Email" 
    : "VisaPath — Reset Your Password";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #1e3a5f; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🌐 VisaCurator</h1>
      </div>
      <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
        <h2 style="color: #111827; margin-top: 0;">
          ${purpose === "verify" ? "Verify your email" : "Reset your password"}
        </h2>
        <p style="color: #6b7280;">
          ${purpose === "verify" 
            ? "Enter this OTP to complete your registration:" 
            : "Enter this OTP to reset your password:"}
        </p>
        <div style="background: white; border: 2px dashed #1e3a5f; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #1e3a5f;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          ⏱ This OTP expires in <strong>10 minutes</strong>.<br/>
          If you didn't request this, ignore this email.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"VisaCurator" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
  });
};

module.exports = { sendOTPEmail };