type TemplateData = {
  token: string | number | undefined;
};

/* eslint-disable no-unused-vars */
type EmailTemplate = {
  subject: string;
  html: (_data: TemplateData) => string;
};

const verify: EmailTemplate = {
  subject: "Verify your account",
  html: ({ token }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Account Verification</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 4px; color: #2563eb;">${token}</h1>
      <p>This code will expire shortly. Do not share it with anyone.</p>
    </div>
  `,
};

const verifyForgot: EmailTemplate = {
  subject: "Password reset request",
  html: ({ token }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset</h2>
      <p>Your password reset code is:</p>
      <h1 style="letter-spacing: 4px; color: #2563eb;">${token}</h1>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `,
};

const adminLogin: EmailTemplate = {
  subject: "Admin login verification",
  html: ({ token }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Admin Login Verification</h2>
      <p>Your admin login code is:</p>
      <h1 style="letter-spacing: 4px; color: #2563eb;">${token}</h1>
      <p>This code will expire shortly.</p>
    </div>
  `,
};

const deleteUser: EmailTemplate = {
  subject: "Account deletion request",
  html: ({ token }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Account Deletion</h2>
      <p>Your account deletion verification code is:</p>
      <h1 style="letter-spacing: 4px; color: #dc2626;">${token}</h1>
      <p>This action is irreversible. If you did not request this, please ignore this email.</p>
    </div>
  `,
};

const EmailTemplates = {
  verify,
  verifyForgot,
  adminLogin,
  deleteUser,
};

export default EmailTemplates;
