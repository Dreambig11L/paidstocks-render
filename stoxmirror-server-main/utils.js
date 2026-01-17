const bcrypt = require("bcryptjs");
const axios = require("axios");
const speakeasy = require("speakeasy");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const salt = bcrypt.genSaltSync(10);
const secret = speakeasy.generateSecret({ length: 4 });

// ----------------------
// Utility Functions
// ----------------------
const hashPassword = (password) => bcrypt.hashSync(password, salt);
const compareHashedPassword = (hashedPassword, password) =>
  bcrypt.compareSync(password, hashedPassword);

// ----------------------
// Email Template Builder
// ----------------------
const buildEmailTemplate = ({ title, bodyHtml }) => `
<html>
  <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#fff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
      <tr>
        <td align="center">
          <table width="600" style="border:1px solid #e0e0e0;border-radius:8px;">
            <tr>
              <td align="center" style="background:#FD7E14;padding:20px;">
                <img src="https://your-cdn.com/logo.png" width="150" />
              </td>
            </tr>
            <tr>
              <td style="padding:30px;color:#333;">
                <h2 style="color:#FD7E14;">${title}</h2>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px;text-align:center;font-size:12px;color:#888;background:#f7f7f7;">
                Paidstocks Team<br/>
                © ${new Date().getFullYear()} Paidstocks
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

// ----------------------
// Generic sendEmail (Resend)
// ----------------------
const sendEmail = async ({ to, subject, title, bodyHtml }) => {
  const html = buildEmailTemplate({ title, bodyHtml });

  const { error } = await resend.emails.send({
    from:"support@paidstocks.com",
    to,
    subject,
    html,
  });

  if (error) throw error;
};

// ----------------------
// ALL EMAIL FUNCTIONS
// ----------------------
const sendWelcomeEmail = async ({ to, otp }) =>
  sendEmail({
    to,
    subject: "Welcome to Paidstocks",
    title: "Welcome to Paidstocks",
    bodyHtml: `
      <p>Confirm your email to secure your account.</p>
      <p style="font-size:18px;font-weight:bold;">OTP: ${otp}</p>
    `,
  });

const resendWelcomeEmail = sendWelcomeEmail;

const sendPasswordOtp = async ({ to, otp }) =>
  sendEmail({
    to,
    subject: "Password Reset",
    title: "Password Reset Request",
    bodyHtml: `
      <p>Password reset requested.</p>
      <p style="font-size:18px;font-weight:bold;">OTP: ${otp}</p>
    `,
  });

const resetEmail = async ({ to }) =>
  sendEmail({
    to,
    subject: "Change Password",
    title: "Change Password",
    bodyHtml: `
      <p>Your OTP:</p>
      <p style="font-size:18px;font-weight:bold;">
        ${speakeasy.totp({ secret: secret.base32, encoding: "base32" })}
      </p>
    `,
  });

const sendVerificationEmail = async ({ from, url }) =>
  sendEmail({
    to: "support@paidstocks.com",
    subject: "Account Verification",
    title: "Account Verified",
    bodyHtml: `
      <p>${from} verified their account.</p>
      <a href="${url}">View document</a>
    `,
  });

const sendDepositEmail = async ({ from, amount, method, timestamp }) =>
  sendEmail({
    to: "support@paidstocks.com",
    subject: "Deposit Notification",
    title: "Deposit Alert",
    bodyHtml: `
      <p>${from} sent $${amount} via ${method}.</p>
      <p>${timestamp}</p>
    `,
  });

const sendDepositApproval = async ({ from, to, amount, method, timestamp }) =>
  sendEmail({
    to,
    subject: "Deposit Approved",
    title: "Deposit Approved",
    bodyHtml: `
      <p>Hello ${from},</p>
      <p>$${amount} via ${method} approved.</p>
      <p>${timestamp}</p>
    `,
  });

const sendBankDepositRequestEmail = async ({ from, amount, method, timestamp }) =>
  sendEmail({
    to: "support@paidstocks.com",
    subject: "Bank Deposit Request",
    title: "Bank Deposit Request",
    bodyHtml: `
      <p>${from} requested bank deposit of $${amount}.</p>
      <p>${timestamp}</p>
    `,
  });

const userRegisteration = async ({ firstName, email }) =>
  sendEmail({
    to: "support@paidstocks.com",
    subject: "New Registration",
    title: "New User Signup",
    bodyHtml: `
      <p>${firstName} (${email}) just signed up.</p>
    `,
  });

const sendWithdrawalRequestEmail = async ({ from, amount, method, address }) =>
  sendEmail({
    to: "support@paidstocks.com",
    subject: "Withdrawal Request",
    title: "Withdrawal Request",
    bodyHtml: `
      <p>${from} requested $${amount}</p>
      <p>Method: ${method}</p>
      <p>Address: ${address}</p>
    `,
  });

const sendWithdrawalEmail = async ({ to, from, amount, method, address, timestamp }) =>
  sendEmail({
    to,
    subject: "Withdrawal Confirmation",
    title: "Withdrawal Confirmation",
    bodyHtml: `
      <p>Hello ${from},</p>
      <p>$${amount} via ${method}</p>
      <p>${address}</p>
      <p>${timestamp}</p>
    `,
  });

const sendUserDepositEmail = async ({ from, to, amount, method, timestamp }) =>
  sendEmail({
    to,
    subject: "Deposit Confirmation",
    title: "Deposit Confirmation",
    bodyHtml: `
      <p>Hello ${from},</p>
      <p>$${amount} via ${method}</p>
      <p>${timestamp}</p>
    `,
  });

const sendPlanEmail = async ({ from, subamount, subname, timestamp }) =>
  sendEmail({
    to: "support@paidstocks.com",
    subject: "Plan Subscription",
    title: "Plan Subscription",
    bodyHtml: `
      <p>${from} subscribed $${subamount} to ${subname}</p>
      <p>${timestamp}</p>
    `,
  });

const sendUserPlanEmail = async ({ from, to, subamount, subname, timestamp }) =>
  sendEmail({
    to,
    subject: "Subscription Confirmation",
    title: "Subscription Confirmed",
    bodyHtml: `
      <p>Hello ${from},</p>
      <p>$${subamount} → ${subname}</p>
      <p>${timestamp}</p>
    `,
  });

const sendUserDetails = async ({ to, password, firstName }) =>
  sendEmail({
    to,
    subject: "Account Details",
    title: "Your Account Details",
    bodyHtml: `
      <p>Hello ${firstName},</p>
      <p>Email: ${to}</p>
      <p>Password: ${password}</p>
    `,
  });

const sendKycAlert = async ({ firstName }) =>
  sendEmail({
    to: "support@paidstocks.com",
    subject: "KYC Alert",
    title: "KYC Submitted",
    bodyHtml: `
      <p>${firstName} submitted KYC documents.</p>
    `,
  });

// ----------------------
// EXPORTS
// ----------------------
module.exports = {
  hashPassword,
  compareHashedPassword,
  sendWelcomeEmail,
  resendWelcomeEmail,
  sendPasswordOtp,
  resetEmail,
  sendVerificationEmail,
  sendDepositEmail,
  sendDepositApproval,
  sendBankDepositRequestEmail,
  userRegisteration,
  sendWithdrawalRequestEmail,
  sendWithdrawalEmail,
  sendUserDepositEmail,
  sendPlanEmail,
  sendUserPlanEmail,
  sendUserDetails,
  sendKycAlert,
};
